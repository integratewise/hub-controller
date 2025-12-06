import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import { Env, Entity, Metric, EntityType } from './types';
import * as db from './db';
import { processCommand, processWithClaude } from './ai';

const app = new Hono<{ Bindings: Env }>();

// CORS for frontend
app.use('*', cors({
  origin: (origin) => {
    // Allow localhost and all hub-controller subdomains
    if (!origin) return 'https://hub-controller.pages.dev';
    if (origin.includes('localhost')) return origin;
    if (origin.includes('hub-controller.pages.dev')) return origin;
    return 'https://hub-controller.pages.dev';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'hub-controller-api' }));
app.get('/api', (c) => c.json({ status: 'ok', version: '1.0.0' }));

// ============ AI Command Endpoint ============
app.post('/api/command', async (c) => {
  const { input, useAdvanced } = await c.req.json();
  if (!input) {
    return c.json({ error: 'Input required' }, 400);
  }

  const result = useAdvanced
    ? await processWithClaude(c.env, input)
    : await processCommand(c.env, input);

  // Log the command
  await c.env.DB.prepare(`
    INSERT INTO ai_commands (id, input, intent, entities_affected, response, success, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    input,
    result.intent,
    result.entities ? JSON.stringify(result.entities.map(e => e.id)) : null,
    result.message,
    1,
    new Date().toISOString()
  ).run();

  return c.json(result);
});

// ============ GPT Chat Endpoint (Streaming with Tool Use) ============
app.post('/api/chat', async (c) => {
  const { message, history } = await c.req.json();

  if (!message) {
    return c.json({ error: 'Message required' }, 400);
  }

  // Gather business context
  const [
    projects,
    customers,
    opportunities,
    tasks,
    teamMembers,
    financeMetrics,
    marketingMetrics,
    teamMetrics,
    recentActivities,
    dashboardStats,
  ] = await Promise.all([
    db.listEntities(c.env.DB, { type: 'project', limit: 20 }),
    db.listEntities(c.env.DB, { type: 'customer', limit: 20 }),
    db.listEntities(c.env.DB, { type: 'opportunity', limit: 10 }),
    db.listEntities(c.env.DB, { type: 'task', limit: 30 }),
    db.listEntities(c.env.DB, { type: 'team_member', limit: 20 }),
    db.getLatestMetrics(c.env.DB, 'finance'),
    db.getLatestMetrics(c.env.DB, 'marketing'),
    db.getLatestMetrics(c.env.DB, 'team'),
    db.getActivities(c.env.DB, undefined, 10),
    db.getDashboardStats(c.env.DB),
  ]);

  const systemPrompt = `You are the AI assistant for IntegrateWise Hub Controller - a business operations platform. You can DIRECTLY execute actions to manage projects, customers, tasks, and more.

## Your Capabilities:
1. **Create & Assign Tasks** - Create tasks and assign them to team members with deadlines
2. **Track Progress** - Check task status, deadlines, and workload distribution
3. **Manage Projects** - Create, update, complete projects
4. **Handle Customers** - Manage customer records and relationships
5. **Monitor Metrics** - Track MRR, burn rate, and other KPIs

IMPORTANT: When users ask you to create, update, or delete something, USE THE TOOLS to execute the action immediately. Don't ask for confirmation - just do it!

## Current Business Context:

### Team Members (assign tasks to these people):
${teamMembers.length > 0 ? teamMembers.map(m => `- ${m.title} (${m.category || 'Team Member'})`).join('\n') : '- No team members yet. You can reference people by name when assigning.'}

### Active Tasks (${tasks.filter(t => t.status === 'active').length} active, ${tasks.filter(t => t.status === 'pending').length} pending):
${tasks.slice(0, 10).map(t => `- [${t.id}] ${t.title} | Owner: ${t.owner || 'Unassigned'} | Due: ${t.due_date || 'No deadline'} | ${t.status}`).join('\n') || 'No tasks yet'}

### Projects (${projects.length} total):
${projects.slice(0, 8).map(p => `- [${p.id}] ${p.title} (${p.status})`).join('\n') || 'No projects yet'}

### Key Metrics:
- MRR: $${financeMetrics.mrr || 120000}
- Burn Rate: $${financeMetrics.burn || 80000}/month
- Runway: ${financeMetrics.runway || 9} months
- Team Utilization: ${teamMetrics.utilization || 72}%

### Customers (${customers.length} total):
${customers.slice(0, 5).map(c => `- ${c.title} (${c.status})`).join('\n') || 'No customers yet'}

### Sales Pipeline: ${opportunities.length} opportunities worth $${opportunities.reduce((sum, o) => sum + ((o.metadata as Record<string, number>)?.amount || 0), 0).toLocaleString()}

## Response Guidelines:
- When users ask to create/update/delete, USE THE TOOLS to execute immediately
- After executing, confirm what you did in a friendly way
- Use markdown for formatting (bold, lists, etc.)
- For dates, convert natural language like "Friday" or "next week" to YYYY-MM-DD format
- Today's date is: ${new Date().toISOString().split('T')[0]}`;

  // Define tools for Claude to use
  const tools = [
    {
      name: 'create_entity',
      description: 'Create a new entity (project, task, customer, document, note, opportunity). Use this for creating projects, tasks, customers etc.',
      input_schema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['project', 'task', 'customer', 'document', 'note', 'opportunity'],
            description: 'The type of entity to create'
          },
          title: {
            type: 'string',
            description: 'The title/name of the entity'
          },
          description: {
            type: 'string',
            description: 'Optional description'
          },
          status: {
            type: 'string',
            enum: ['active', 'pending', 'completed', 'archived', 'blocked'],
            description: 'Status of the entity (default: active)'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Priority level (default: medium)'
          },
          category: {
            type: 'string',
            description: 'Category/type for organization'
          },
          owner: {
            type: 'string',
            description: 'Person assigned to this entity (for tasks)'
          },
          due_date: {
            type: 'string',
            description: 'Due date in ISO format (YYYY-MM-DD)'
          },
          parent_id: {
            type: 'string',
            description: 'Parent entity ID (to link tasks to projects)'
          }
        },
        required: ['type', 'title']
      }
    },
    {
      name: 'update_entity',
      description: 'Update an existing entity by ID. Use to change status, reassign, update priority, change due dates.',
      input_schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the entity to update'
          },
          title: {
            type: 'string',
            description: 'New title'
          },
          status: {
            type: 'string',
            enum: ['active', 'pending', 'completed', 'archived', 'blocked'],
            description: 'New status'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'New priority'
          },
          description: {
            type: 'string',
            description: 'New description'
          },
          owner: {
            type: 'string',
            description: 'Reassign to a different person'
          },
          due_date: {
            type: 'string',
            description: 'New due date in ISO format (YYYY-MM-DD)'
          }
        },
        required: ['id']
      }
    },
    {
      name: 'delete_entity',
      description: 'Delete an entity by ID',
      input_schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the entity to delete'
          }
        },
        required: ['id']
      }
    },
    {
      name: 'search_entities',
      description: 'Search for entities by query text',
      input_schema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          }
        },
        required: ['query']
      }
    },
    {
      name: 'list_entities',
      description: 'List entities with filters. Use to get tasks by owner, projects by status, items due soon, etc.',
      input_schema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['project', 'task', 'customer', 'document', 'note', 'opportunity', 'team_member'],
            description: 'Filter by entity type'
          },
          status: {
            type: 'string',
            enum: ['active', 'pending', 'completed', 'archived', 'blocked'],
            description: 'Filter by status'
          },
          owner: {
            type: 'string',
            description: 'Filter by assigned owner'
          },
          category: {
            type: 'string',
            description: 'Filter by category'
          }
        }
      }
    },
    {
      name: 'create_metric',
      description: 'Record a new metric value',
      input_schema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Metric name (e.g., mrr, burn, leads)'
          },
          value: {
            type: 'number',
            description: 'The metric value'
          },
          category: {
            type: 'string',
            enum: ['finance', 'sales', 'marketing', 'team'],
            description: 'Category of the metric'
          }
        },
        required: ['key', 'value', 'category']
      }
    },
    {
      name: 'get_tasks_due',
      description: 'Get tasks that are due within a time range. Use for deadline tracking.',
      input_schema: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look ahead (default: 7)'
          },
          owner: {
            type: 'string',
            description: 'Filter by assigned person'
          }
        }
      }
    },
    {
      name: 'get_team_workload',
      description: 'Get workload and task distribution across team members',
      input_schema: {
        type: 'object',
        properties: {}
      }
    }
  ];

  // Check for API key
  if (!c.env.ANTHROPIC_API_KEY) {
    // Fallback response without AI - try to handle actions locally
    const actionResult = await handleLocalAction(c.env.DB, message, {
      projects,
      customers,
      opportunities,
      financeMetrics,
      marketingMetrics,
      teamMetrics,
    });

    return streamSSE(c, async (stream) => {
      await stream.writeSSE({ data: JSON.stringify({ content: actionResult }) });
      await stream.writeSSE({ data: '[DONE]' });
    });
  }

  // Use Claude with tools
  return streamSSE(c, async (stream) => {
    try {
      // First call: Let Claude decide what to do
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': c.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          tools,
          messages: [
            ...(history || []).map((h: { role: string; content: string }) => ({
              role: h.role,
              content: h.content,
            })),
            { role: 'user', content: message },
          ],
        }),
      });

      if (!response.ok) {
        await stream.writeSSE({ data: JSON.stringify({ error: `API Error: ${response.status}` }) });
        await stream.writeSSE({ data: '[DONE]' });
        return;
      }

      const result = await response.json() as {
        content: Array<{
          type: string;
          text?: string;
          id?: string;
          name?: string;
          input?: Record<string, unknown>;
        }>;
        stop_reason: string;
      };

      // Process the response
      let textContent = '';
      const toolResults: Array<{ tool_use_id: string; result: unknown }> = [];

      for (const block of result.content) {
        if (block.type === 'text') {
          textContent += block.text;
        } else if (block.type === 'tool_use') {
          // Execute the tool
          const toolResult = await executeToolCall(c.env.DB, block.name!, block.input!);
          toolResults.push({
            tool_use_id: block.id!,
            result: toolResult,
          });
        }
      }

      // If there were tool calls, get a follow-up response
      if (toolResults.length > 0) {
        const followUpMessages = [
          ...(history || []).map((h: { role: string; content: string }) => ({
            role: h.role,
            content: h.content,
          })),
          { role: 'user', content: message },
          { role: 'assistant', content: result.content },
          {
            role: 'user',
            content: toolResults.map(tr => ({
              type: 'tool_result',
              tool_use_id: tr.tool_use_id,
              content: JSON.stringify(tr.result),
            })),
          },
        ];

        const followUpResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': c.env.ANTHROPIC_API_KEY!,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            system: systemPrompt,
            tools,
            messages: followUpMessages,
          }),
        });

        if (followUpResponse.ok) {
          const followUpResult = await followUpResponse.json() as {
            content: Array<{ type: string; text?: string }>;
          };
          textContent = followUpResult.content
            .filter(b => b.type === 'text')
            .map(b => b.text)
            .join('');
        }
      }

      // Stream the final text response
      if (textContent) {
        // Stream character by character for effect (or in chunks)
        const words = textContent.split(' ');
        for (let i = 0; i < words.length; i++) {
          const word = words[i] + (i < words.length - 1 ? ' ' : '');
          await stream.writeSSE({ data: JSON.stringify({ content: word }) });
          // Small delay for streaming effect
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }

      await stream.writeSSE({ data: '[DONE]' });

      // Log the conversation
      await c.env.DB.prepare(`
        INSERT INTO ai_commands (id, input, intent, response, success, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        message,
        toolResults.length > 0 ? 'action' : 'chat',
        textContent.slice(0, 500),
        1,
        new Date().toISOString()
      ).run();

    } catch (error) {
      console.error('Chat error:', error);
      await stream.writeSSE({
        data: JSON.stringify({
          error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      });
      await stream.writeSSE({ data: '[DONE]' });
    }
  });
});

// Execute tool calls
async function executeToolCall(
  database: D1Database,
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case 'create_entity': {
      const entity = await db.createEntity(database, {
        type: input.type as EntityType,
        title: input.title as string,
        description: input.description as string | undefined,
        status: (input.status as 'active' | 'pending' | 'completed' | 'archived' | 'blocked') || 'active',
        priority: (input.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
        category: input.category as string | undefined,
        owner: input.owner as string | undefined,
        due_date: input.due_date as string | undefined,
        parent_id: input.parent_id as string | undefined,
      });
      await db.logActivity(database, {
        entity_id: entity.id,
        action: 'created',
        details: { via: 'ai_chat', owner: input.owner, due_date: input.due_date },
      });
      return {
        success: true,
        entity,
        message: `Created ${entity.type} "${entity.title}"${entity.owner ? ` assigned to ${entity.owner}` : ''}${entity.due_date ? ` due ${entity.due_date}` : ''}`
      };
    }

    case 'update_entity': {
      const { id, ...updates } = input;
      const entity = await db.updateEntity(database, id as string, updates as Partial<Entity>);
      if (entity) {
        await db.logActivity(database, {
          entity_id: entity.id,
          action: 'updated',
          details: { via: 'ai_chat', changes: updates },
        });
      }
      return entity ? { success: true, entity } : { success: false, error: 'Entity not found' };
    }

    case 'delete_entity': {
      const deleted = await db.deleteEntity(database, input.id as string);
      return { success: deleted };
    }

    case 'search_entities': {
      const entities = await db.searchEntities(database, input.query as string);
      return { success: true, entities, count: entities.length };
    }

    case 'list_entities': {
      const entities = await db.listEntities(database, {
        type: input.type as EntityType | undefined,
        status: input.status as 'active' | 'pending' | 'completed' | 'archived' | 'blocked' | undefined,
        owner: input.owner as string | undefined,
        category: input.category as string | undefined,
        limit: 50,
      });
      return {
        success: true,
        entities,
        count: entities.length,
        summary: entities.map(e => ({
          id: e.id,
          title: e.title,
          type: e.type,
          status: e.status,
          owner: e.owner,
          due_date: e.due_date,
          priority: e.priority,
        }))
      };
    }

    case 'create_metric': {
      const metric = await db.createMetric(database, {
        key: input.key as string,
        value: input.value as number,
        category: input.category as string,
      });
      return { success: true, metric };
    }

    case 'get_tasks_due': {
      const days = (input.days as number) || 7;
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      // Get all tasks and filter by due date
      const allTasks = await db.listEntities(database, {
        type: 'task',
        owner: input.owner as string | undefined,
      });

      const tasksDue = allTasks.filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        return dueDate >= now && dueDate <= futureDate;
      }).sort((a, b) => {
        const dateA = new Date(a.due_date || '');
        const dateB = new Date(b.due_date || '');
        return dateA.getTime() - dateB.getTime();
      });

      const overdue = allTasks.filter(t => {
        if (!t.due_date || t.status === 'completed') return false;
        return new Date(t.due_date) < now;
      });

      return {
        success: true,
        upcoming: tasksDue.map(t => ({
          id: t.id,
          title: t.title,
          due_date: t.due_date,
          owner: t.owner,
          priority: t.priority,
          status: t.status,
        })),
        overdue: overdue.map(t => ({
          id: t.id,
          title: t.title,
          due_date: t.due_date,
          owner: t.owner,
          priority: t.priority,
        })),
        upcomingCount: tasksDue.length,
        overdueCount: overdue.length,
      };
    }

    case 'get_team_workload': {
      const tasks = await db.listEntities(database, { type: 'task', status: 'active' });
      const teamMembers = await db.listEntities(database, { type: 'team_member' });

      // Group tasks by owner
      const workload: Record<string, { assigned: number; tasks: string[] }> = {};

      for (const task of tasks) {
        const owner = task.owner || 'Unassigned';
        if (!workload[owner]) {
          workload[owner] = { assigned: 0, tasks: [] };
        }
        workload[owner].assigned++;
        workload[owner].tasks.push(task.title);
      }

      return {
        success: true,
        workload,
        teamMembers: teamMembers.map(m => ({
          name: m.title,
          role: m.category,
          tasksAssigned: workload[m.title]?.assigned || 0,
        })),
        totalActiveTasks: tasks.length,
        unassignedTasks: workload['Unassigned']?.assigned || 0,
      };
    }

    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// Handle actions locally when no API key
async function handleLocalAction(
  database: D1Database,
  message: string,
  context: {
    projects: Entity[];
    customers: Entity[];
    opportunities: Entity[];
    financeMetrics: Record<string, number>;
    marketingMetrics: Record<string, number>;
    teamMetrics: Record<string, number>;
  }
): Promise<string> {
  const normalized = message.toLowerCase();

  // Create patterns
  const createMatch = normalized.match(/create\s+(a\s+)?(project|task|customer|note)\s*(called|named)?\s*[:\s]*(.+)/i);
  if (createMatch) {
    const type = createMatch[2] as EntityType;
    const title = createMatch[4]?.trim().replace(/["']/g, '') || 'Untitled';
    const entity = await db.createEntity(database, {
      type,
      title,
      status: 'active',
      priority: 'medium',
    });
    await db.logActivity(database, {
      entity_id: entity.id,
      action: 'created',
      details: { via: 'ai_chat' },
    });
    return `Done! I created a new ${type} called **"${entity.title}"**.\n\nID: \`${entity.id}\`\nStatus: ${entity.status}`;
  }

  // Delete patterns
  const deleteMatch = normalized.match(/delete\s+(the\s+)?(project|task|customer)\s*(called|named|with id)?\s*[:\s]*(.+)/i);
  if (deleteMatch) {
    const searchTerm = deleteMatch[4]?.trim().replace(/["']/g, '');
    // Try to find by title first
    const allEntities = [...context.projects, ...context.customers];
    const found = allEntities.find(e =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id === searchTerm
    );
    if (found) {
      await db.deleteEntity(database, found.id);
      return `Done! I deleted the ${found.type} **"${found.title}"**.`;
    }
    return `I couldn't find an entity matching "${searchTerm}". Please check the name or ID.`;
  }

  // Mark as complete patterns
  const completeMatch = normalized.match(/(complete|finish|mark\s+as\s+(done|completed?))\s+(the\s+)?(project|task)\s*[:\s]*(.+)/i);
  if (completeMatch) {
    const searchTerm = completeMatch[5]?.trim().replace(/["']/g, '');
    const found = context.projects.find(p =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (found) {
      await db.updateEntity(database, found.id, { status: 'completed' });
      return `Done! I marked **"${found.title}"** as completed.`;
    }
    return `I couldn't find a project matching "${searchTerm}".`;
  }

  // Fallback to read-only responses
  return generateFallbackResponse(message, context);
}

// Fallback response generator when no API key
function generateFallbackResponse(
  message: string,
  context: {
    projects: Entity[];
    customers: Entity[];
    opportunities: Entity[];
    financeMetrics: Record<string, number>;
    marketingMetrics: Record<string, number>;
    teamMetrics: Record<string, number>;
  }
): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('mrr') || normalized.includes('revenue')) {
    return `**Current MRR:** $${(context.financeMetrics.mrr || 120000).toLocaleString()}

Our monthly recurring revenue shows the subscription-based income. This is a key metric for measuring growth.`;
  }

  if (normalized.includes('burn') || normalized.includes('runway')) {
    const burn = context.financeMetrics.burn || 80000;
    const runway = context.financeMetrics.runway || 9;
    return `**Financial Overview:**
- **Monthly Burn Rate:** $${burn.toLocaleString()}
- **Runway:** ${runway} months

Based on current spending, we have approximately ${runway} months of runway remaining.`;
  }

  if (normalized.includes('project')) {
    const activeProjects = context.projects.filter(p => p.status === 'active');
    return `**Projects Overview:**
- **Total Projects:** ${context.projects.length}
- **Active:** ${activeProjects.length}

**Active Projects:**
${activeProjects.slice(0, 5).map(p => `- ${p.title} (${p.category || 'General'})`).join('\n')}

Would you like me to create a new project or get details on a specific one?`;
  }

  if (normalized.includes('customer')) {
    return `**Customers Overview:**
- **Total Customers:** ${context.customers.length}

**Top Customers:**
${context.customers.slice(0, 5).map(c => `- ${c.title} (${c.status})`).join('\n')}

I can help you view customer details or update their information.`;
  }

  if (normalized.includes('sale') || normalized.includes('pipeline') || normalized.includes('opportunit')) {
    const totalValue = context.opportunities.reduce((sum, o) =>
      sum + ((o.metadata as Record<string, number>)?.amount || 0), 0);
    return `**Sales Pipeline:**
- **Open Opportunities:** ${context.opportunities.length}
- **Total Pipeline Value:** $${totalValue.toLocaleString()}

**Opportunities:**
${context.opportunities.map(o => `- ${o.title}: $${((o.metadata as Record<string, number>)?.amount || 0).toLocaleString()} (${o.status})`).join('\n')}`;
  }

  if (normalized.includes('team') || normalized.includes('utilization')) {
    return `**Team Overview:**
- **Overall Utilization:** ${context.teamMetrics.utilization || 72}%

A healthy utilization rate is typically between 70-85%. Your team is operating within the optimal range.`;
  }

  if (normalized.includes('create')) {
    return `I can help you create new items! Here are some examples:

- "Create a project called Mobile App"
- "Create a task for API development"
- "Add a new customer"

What would you like to create?`;
  }

  // Default response
  return `I'm your Hub Controller AI assistant. I can help you with:

- **Metrics** - "What's our MRR?" "Show burn rate"
- **Projects** - "Show all projects" "Create a new project"
- **Customers** - "List customers" "Customer health scores"
- **Sales** - "Show pipeline" "Pull opportunities"
- **Team** - "Team utilization" "Show team members"

What would you like to know?`;
}

// ============ Entities CRUD ============
app.get('/api/entities', async (c) => {
  const type = c.req.query('type') as EntityType | undefined;
  const status = c.req.query('status') as 'active' | 'completed' | 'archived' | 'blocked' | 'pending' | undefined;
  const category = c.req.query('category');
  const owner = c.req.query('owner');
  const source = c.req.query('source');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');

  const entities = await db.listEntities(c.env.DB, {
    type,
    status,
    category: category || undefined,
    owner: owner || undefined,
    source: source || undefined,
    limit,
    offset,
  });

  return c.json(entities);
});

app.get('/api/entities/search', async (c) => {
  const q = c.req.query('q');
  if (!q) {
    return c.json({ error: 'Query required' }, 400);
  }
  const entities = await db.searchEntities(c.env.DB, q);
  return c.json(entities);
});

app.get('/api/entities/:id', async (c) => {
  const entity = await db.getEntity(c.env.DB, c.req.param('id'));
  if (!entity) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json(entity);
});

app.post('/api/entities', async (c) => {
  const data = await c.req.json();
  const entity = await db.createEntity(c.env.DB, data);
  await db.logActivity(c.env.DB, {
    entity_id: entity.id,
    action: 'created',
  });
  return c.json(entity, 201);
});

app.put('/api/entities/:id', async (c) => {
  const data = await c.req.json();
  const entity = await db.updateEntity(c.env.DB, c.req.param('id'), data);
  if (!entity) {
    return c.json({ error: 'Not found' }, 404);
  }
  await db.logActivity(c.env.DB, {
    entity_id: entity.id,
    action: 'updated',
    details: { changes: data },
  });
  return c.json(entity);
});

app.delete('/api/entities/:id', async (c) => {
  const deleted = await db.deleteEntity(c.env.DB, c.req.param('id'));
  if (!deleted) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json({ success: true });
});

// ============ Type-specific aliases ============
// Projects
app.get('/api/projects', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'project' });
  return c.json(entities);
});

app.post('/api/projects', async (c) => {
  const data = await c.req.json();
  const entity = await db.createEntity(c.env.DB, { ...data, type: 'project' });
  return c.json(entity, 201);
});

// Tasks
app.get('/api/tasks', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'task' });
  return c.json(entities);
});

// Customers
app.get('/api/customers', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'customer' });
  // Transform to expected format
  const customers = entities.map(e => ({
    id: e.id,
    name: e.title,
    status: e.status,
    mrr: (e.metadata as Record<string, number>)?.mrr || 0,
    healthScore: (e.metadata as Record<string, number>)?.healthScore || 0,
    lastActivity: e.updated_at,
  }));
  return c.json(customers);
});

// Opportunities (Salesforce)
app.get('/api/integrations/salesforce/opportunities', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'opportunity' });
  const opportunities = entities.map(e => ({
    id: e.id,
    name: e.title,
    account: (e.metadata as Record<string, string>)?.account || '',
    stage: e.status,
    amount: (e.metadata as Record<string, number>)?.amount || 0,
    closeDate: e.due_date,
  }));
  return c.json(opportunities);
});

// ============ Metrics ============
app.get('/api/metrics/kpis', async (c) => {
  const category = c.req.query('category');
  const period = c.req.query('period');
  const metrics = await db.getMetrics(c.env.DB, category || undefined, period || undefined);
  return c.json(metrics);
});

app.get('/api/metrics/latest', async (c) => {
  const category = c.req.query('category');
  const metrics = await db.getLatestMetrics(c.env.DB, category || undefined);
  return c.json(metrics);
});

app.post('/api/metrics', async (c) => {
  const data = await c.req.json();
  const metric = await db.createMetric(c.env.DB, data);
  return c.json(metric, 201);
});

// ============ Finance ============
app.get('/api/finance/summary', async (c) => {
  const metrics = await db.getLatestMetrics(c.env.DB, 'finance');
  return c.json({
    budget: metrics.budget || 1000000,
    actual: metrics.actual || 800000,
    burn: metrics.burn || 80000,
    runwayMonths: metrics.runway || 9,
  });
});

// ============ Marketing ============
app.get('/api/marketing/metrics', async (c) => {
  const metrics = await db.getLatestMetrics(c.env.DB, 'marketing');
  return c.json({
    leads: metrics.leads || 0,
    mqls: metrics.mqls || 0,
    cac: metrics.cac || 0,
    roi: metrics.roi || 0,
  });
});

// ============ Team ============
app.get('/api/team/utilization', async (c) => {
  const metrics = await db.getLatestMetrics(c.env.DB, 'team');
  return c.json({ overall: metrics.utilization || 72 });
});

app.get('/api/team/members', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'team_member' });
  const members = entities.map(e => ({
    name: e.title,
    role: e.category,
    utilization: (e.metadata as Record<string, number>)?.utilization || 0,
    status: e.status === 'active' ? 'Active' : 'Inactive',
  }));
  return c.json(members);
});

// ============ Digital/IT ============
app.get('/api/digital/systems', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'document', category: 'system' });
  const systems = entities.map(e => ({
    name: e.title,
    type: (e.metadata as Record<string, string>)?.type || 'Infrastructure',
    status: e.status === 'active' ? 'Operational' : 'Degraded',
    uptime: (e.metadata as Record<string, string>)?.uptime || '99.9%',
  }));
  return c.json(systems);
});

// ============ Ops/Compliance ============
app.get('/api/ops/compliance', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'compliance' });
  const items = entities.map(e => ({
    item: e.title,
    status: e.status === 'completed' ? 'Complete' : 'Pending',
    dueDate: e.due_date || '',
    owner: e.owner || '',
  }));
  return c.json(items);
});

// ============ R&D ============
app.get('/api/rnd/projects', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'rnd' });
  const projects = entities.map(e => ({
    name: e.title,
    category: e.category || 'General',
    status: e.status === 'active' ? 'Active' : e.status === 'pending' ? 'Planning' : 'Completed',
    progress: (e.metadata as Record<string, number>)?.progress || 0,
  }));
  return c.json(projects);
});

// ============ Investors ============
app.get('/api/investors/reports', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'document', category: 'investor' });
  const reports = entities.map(e => ({
    title: e.title,
    type: (e.metadata as Record<string, string>)?.type || 'Report',
    date: e.created_at,
    status: e.status === 'completed' ? 'Sent' : 'Draft',
  }));
  return c.json(reports);
});

// ============ Docs Hub ============
app.get('/api/integrations/index/docs', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'document' });
  const docs = entities.map(e => ({
    source: e.source || 'manual',
    title: e.title,
    url: (e.metadata as Record<string, string>)?.url || '#',
    tags: e.tags || [],
  }));
  return c.json(docs);
});

// ============ Activities ============
app.get('/api/activities', async (c) => {
  const entityId = c.req.query('entity_id');
  const limit = parseInt(c.req.query('limit') || '50');
  const activities = await db.getActivities(c.env.DB, entityId || undefined, limit);
  return c.json(activities);
});

// ============ Dashboard ============
app.get('/api/dashboard', async (c) => {
  const stats = await db.getDashboardStats(c.env.DB);
  return c.json(stats);
});

// ============ Integrations ============
app.get('/api/integrations', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM integrations ORDER BY name').all();
  return c.json(result.results || []);
});

app.post('/api/integrations', async (c) => {
  const { name, type, config } = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO integrations (id, name, type, config, status, created_at)
    VALUES (?, ?, ?, ?, 'active', ?)
  `).bind(id, name, type, JSON.stringify(config), new Date().toISOString()).run();
  return c.json({ id, name, type, status: 'active' }, 201);
});

export default app;
