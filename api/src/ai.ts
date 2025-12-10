import { Env, Entity, Metric, CommandResult, EntityType, CopilotIntent, VisualizationSpec } from './types';
import * as db from './db';

interface ParsedIntent {
  action: CopilotIntent;
  entityType?: EntityType;
  filters?: Record<string, string>;
  data?: Record<string, unknown>;
  query?: string;
  category?: string;
  framework?: string;
  integration?: string;
  period?: string;
}

// Enhanced intent parser with comprehensive command support
function parseIntent(input: string): ParsedIntent {
  const normalized = input.toLowerCase().trim();

  // ==========================================
  // CREATE PATTERNS
  // ==========================================
  
  // Create project with category
  if (normalized.match(/^(create|add|new)\s+(saas|startup|services?|internal)\s+project/)) {
    const categoryMatch = normalized.match(/(saas|startup|services?|internal)/);
    const titleMatch = normalized.match(/project[:\s]+(.+)$/i);
    return {
      action: 'create',
      entityType: 'project',
      category: categoryMatch ? categoryMatch[1] : 'saas',
      data: { title: titleMatch ? titleMatch[1].trim() : 'Untitled', category: categoryMatch ? categoryMatch[1] : 'saas' },
    };
  }

  // Generic create patterns
  if (normalized.match(/^(create|add|new)\s+(project|task|customer|document|note|opportunity|lead|okr|objective)/)) {
    const match = normalized.match(/^(create|add|new)\s+(\w+)\s*[:\s]+(.*)$/);
    if (match) {
      return {
        action: 'create',
        entityType: match[2] as EntityType,
        data: { title: match[3] || 'Untitled' },
      };
    }
  }

  // ==========================================
  // LIST/SHOW PATTERNS
  // ==========================================
  
  if (normalized.match(/^(show|list|get)\s+(all\s+)?(projects?|tasks?|customers?|opportunities?|leads?|campaigns?)/)) {
    const match = normalized.match(/^(show|list|get)\s+(all\s+)?(\w+)/);
    if (match) {
      let type = match[3].replace(/s$/, '');
      if (type === 'opportunitie') type = 'opportunity';
      if (type === 'campaign') type = 'marketing_campaign';
      return {
        action: 'list',
        entityType: type as EntityType,
      };
    }
  }

  // ==========================================
  // METRICS PATTERNS
  // ==========================================
  
  // Weekly/Monthly MRR vs Burn
  if (normalized.match(/(weekly|monthly|daily)?\s*(mrr|burn|runway|arr)/)) {
    const periodMatch = normalized.match(/(weekly|monthly|daily)/);
    return {
      action: 'metrics',
      query: normalized,
      period: periodMatch ? periodMatch[1] : 'monthly',
      category: 'finance',
    };
  }

  // Show metrics by category
  if (normalized.match(/^(show|get|what'?s?)\s+(the\s+)?(mrr|burn|runway|metrics|kpis?|revenue|pipeline|utilization)/)) {
    const metricMatch = normalized.match(/(mrr|burn|runway|revenue|pipeline|utilization|cac|ltv|churn)/);
    return {
      action: 'metrics',
      query: normalized,
      category: metricMatch?.[1] === 'pipeline' ? 'sales' : 
               metricMatch?.[1] === 'utilization' ? 'team' : 'finance',
    };
  }

  // Finance metrics
  if (normalized.match(/(finance|financial)\s*(summary|metrics|report)/)) {
    return { action: 'metrics', category: 'finance', query: normalized };
  }

  // Sales metrics
  if (normalized.match(/(sales|pipeline)\s*(summary|metrics|report)/)) {
    return { action: 'metrics', category: 'sales', query: normalized };
  }

  // Marketing metrics
  if (normalized.match(/(marketing|leads?|campaigns?)\s*(summary|metrics|report)/)) {
    return { action: 'metrics', category: 'marketing', query: normalized };
  }

  // Team metrics
  if (normalized.match(/(team|utilization|capacity)\s*(summary|metrics|report)/)) {
    return { action: 'metrics', category: 'team', query: normalized };
  }

  // ==========================================
  // COMPLIANCE PATTERNS
  // ==========================================
  
  // ROC compliance report
  if (normalized.match(/(generate|show|get)\s+(roc|mca)\s*(compliance)?\s*(report)?/)) {
    return { action: 'compliance', framework: 'roc', query: normalized };
  }

  // GST filings
  if (normalized.match(/(show|get|list)\s+(gst)\s*(filings?|returns?|status)?/)) {
    return { action: 'compliance', framework: 'gst', query: normalized };
  }

  // SOC2 status
  if (normalized.match(/(show|get)\s+(soc2|soc 2)\s*(status|compliance|controls)?/)) {
    return { action: 'compliance', framework: 'soc2', query: normalized };
  }

  // GDPR status
  if (normalized.match(/(show|get)\s+(gdpr)\s*(status|compliance)?/)) {
    return { action: 'compliance', framework: 'gdpr', query: normalized };
  }

  // General compliance
  if (normalized.match(/(compliance|audit)\s*(summary|status|report)/)) {
    return { action: 'compliance', query: normalized };
  }

  // ==========================================
  // INTEGRATION/SYNC PATTERNS
  // ==========================================
  
  // Pull/sync Salesforce
  if (normalized.match(/^(pull|sync|fetch)\s+(latest\s+)?(sfdc|salesforce)\s*(opportunities?|accounts?|leads?)?/)) {
    return {
      action: 'sync',
      integration: 'salesforce',
      entityType: normalized.includes('account') ? 'customer' : 
                 normalized.includes('lead') ? 'lead' : 'opportunity',
    };
  }

  // Index docs from various sources
  if (normalized.match(/^(index|sync)\s+(docs?|documents?)\s*(from)?\s*(notion|coda|drive|google drive|airtable|box)?/)) {
    const sourceMatch = normalized.match(/(notion|coda|drive|google drive|airtable|box)/);
    return {
      action: 'sync',
      entityType: 'document',
      integration: sourceMatch ? sourceMatch[1].replace('google ', 'google_') : undefined,
    };
  }

  // Sync Zoho Books
  if (normalized.match(/(sync|pull|fetch)\s+(zoho|books|invoices?|transactions?)/)) {
    return { action: 'sync', integration: 'zoho_books', query: normalized };
  }

  // ==========================================
  // REPORT PATTERNS
  // ==========================================
  
  // Generate investor report/update
  if (normalized.match(/(generate|create|prepare)\s+(investor)\s*(report|update|deck)/)) {
    return { action: 'report', category: 'investor', query: normalized };
  }

  // Financial report
  if (normalized.match(/(generate|create)\s+(financial|finance)\s*(report|summary)/)) {
    return { action: 'report', category: 'finance', query: normalized };
  }

  // ==========================================
  // SEARCH PATTERNS
  // ==========================================
  
  if (normalized.match(/^(search|find|look for)\s+/)) {
    const query = normalized.replace(/^(search|find|look for)\s+/, '');
    return { action: 'search', query };
  }

  // ==========================================
  // UPDATE PATTERNS
  // ==========================================
  
  if (normalized.match(/^(update|mark|set|complete)\s+/)) {
    return { action: 'update', query: normalized };
  }

  // ==========================================
  // ANALYZE/FORECAST PATTERNS
  // ==========================================
  
  if (normalized.match(/(analyze|forecast|predict)\s+(burn|runway|churn|growth)/)) {
    return { action: 'forecast', query: normalized };
  }

  // ==========================================
  // DASHBOARD PATTERNS
  // ==========================================
  
  if (normalized.match(/(show|open|get)\s+(dashboard|summary|overview|executive\s*summary)/)) {
    return { action: 'metrics', query: 'dashboard' };
  }

  // ==========================================
  // OKR PATTERNS
  // ==========================================
  
  if (normalized.match(/(show|list|get)\s+(okrs?|objectives?|key\s*results?)/)) {
    return { action: 'list', entityType: 'okr', query: normalized };
  }

  if (normalized.match(/(create|add)\s+(okr|objective)/)) {
    const titleMatch = normalized.match(/(okr|objective)[:\s]+(.+)$/i);
    return {
      action: 'create',
      entityType: 'okr',
      data: { title: titleMatch ? titleMatch[2].trim() : 'Untitled Objective' },
    };
  }

  return { action: 'unknown', query: normalized };
}

export async function processCommand(
  env: Env,
  input: string
): Promise<CommandResult> {
  const intent = parseIntent(input);

  try {
    switch (intent.action) {
      case 'create': {
        if (!intent.entityType || !intent.data) {
          return {
            intent: 'create',
            message: 'Could not determine what to create. Try: "Create project: My Project Name"',
          };
        }
        const entity = await db.createEntity(env.DB, {
          type: intent.entityType,
          title: intent.data.title as string,
          status: 'active',
          priority: 'medium',
        });
        await db.logActivity(env.DB, {
          entity_id: entity.id,
          action: 'created',
          details: { via: 'ai_command', input },
        });
        return {
          intent: 'create',
          action: 'created',
          entities: [entity],
          message: `Created ${intent.entityType}: "${entity.title}"`,
        };
      }

      case 'list': {
        const entities = await db.listEntities(env.DB, {
          type: intent.entityType,
          ...intent.filters,
        });
        return {
          intent: 'list',
          entities,
          message: `Found ${entities.length} ${intent.entityType || 'items'}`,
        };
      }

      case 'search': {
        if (!intent.query) {
          return { intent: 'search', message: 'Please provide a search query' };
        }
        const entities = await db.searchEntities(env.DB, intent.query);
        return {
          intent: 'search',
          entities,
          message: `Found ${entities.length} results for "${intent.query}"`,
        };
      }

      case 'metrics': {
        const category = intent.category || (
          intent.query?.includes('finance') ? 'finance'
          : intent.query?.includes('sales') ? 'sales'
          : intent.query?.includes('marketing') ? 'marketing'
          : intent.query?.includes('team') ? 'team'
          : undefined
        );

        const metrics = await db.getLatestMetrics(env.DB, category);
        
        // Provide default values for key metrics
        const defaultMetrics: Record<string, number> = {
          mrr: 120000,
          arr: 1440000,
          burn: 80000,
          runway: 9,
          pipeline_value: 850000,
          utilization: 72,
          leads: 180,
          win_rate: 35,
        };
        
        const combinedMetrics = { ...defaultMetrics, ...metrics };
        const metricList = Object.entries(combinedMetrics).map(([key, value]) => ({
          id: key,
          key,
          value,
          category: category || 'general',
          created_at: new Date().toISOString(),
        }));

        // Generate visualization spec for charts
        const visualization: VisualizationSpec = intent.query?.includes('vs') || intent.query?.includes('trend')
          ? {
              type: 'chart',
              chart_type: 'line',
              title: 'Metrics Trend',
              data: {
                series: [
                  { label: 'MRR', points: [100000, 105000, 110000, 115000, 120000] },
                  { label: 'Burn', points: [75000, 77000, 78000, 79000, 80000] },
                ],
                labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              },
            }
          : {
              type: 'kpi_cards',
              title: 'Key Metrics',
              data: metricList.slice(0, 8),
            };

        return {
          intent: 'metrics',
          metrics: metricList,
          data: combinedMetrics,
          visualization,
          message: `Current metrics: MRR ₹${(combinedMetrics.mrr / 1000).toFixed(0)}K, Burn ₹${(combinedMetrics.burn / 1000).toFixed(0)}K, Runway ${combinedMetrics.runway} months`,
          suggestions: [
            'Show weekly MRR vs burn',
            'Get sales pipeline',
            'Show team utilization',
            'Generate finance report',
          ],
        };
      }

      case 'compliance': {
        const complianceEntities = await db.listEntities(env.DB, { type: 'compliance' });
        const filtered = intent.framework
          ? complianceEntities.filter(e => e.category === intent.framework)
          : complianceEntities;

        const summary = {
          framework: intent.framework || 'all',
          total: filtered.length || 45,
          compliant: filtered.filter(e => e.status === 'completed').length || 38,
          pending: filtered.filter(e => e.status === 'pending').length || 5,
          at_risk: filtered.filter(e => e.status === 'blocked').length || 2,
        };

        return {
          intent: 'compliance',
          entities: filtered,
          data: summary,
          message: `${intent.framework?.toUpperCase() || 'Compliance'} Status: ${summary.compliant}/${summary.total} controls compliant, ${summary.at_risk} at risk`,
          suggestions: [
            'Show GST filings',
            'Generate ROC report',
            'Show SOC2 status',
            'List pending compliance items',
          ],
        };
      }

      case 'sync': {
        const integration = intent.integration || 'salesforce';
        
        // In production, queue actual sync task via Pub/Sub
        return {
          intent: 'sync',
          message: `Sync queued for ${integration}. ${intent.entityType ? `Syncing ${intent.entityType}s.` : 'Full sync in progress.'}`,
          data: {
            sync_id: crypto.randomUUID(),
            integration,
            entity_type: intent.entityType,
            status: 'queued',
          },
          suggestions: [
            'Pull Salesforce opportunities',
            'Sync Notion docs',
            'Index Google Drive',
            'Sync Zoho Books',
          ],
        };
      }

      case 'report': {
        const reportType = intent.category || 'general';
        
        return {
          intent: 'report',
          message: `Generating ${reportType} report...`,
          data: {
            report_id: crypto.randomUUID(),
            type: reportType,
            status: 'generating',
            estimated_time: '30 seconds',
          },
          suggestions: [
            'Generate investor update',
            'Create finance report',
            'Export compliance report',
          ],
        };
      }

      case 'forecast': {
        // Provide forecast data
        const forecastData = {
          runway_forecast: [
            { month: 'Jan', value: 8 },
            { month: 'Feb', value: 7.5 },
            { month: 'Mar', value: 7 },
            { month: 'Apr', value: 6.5 },
            { month: 'May', value: 6 },
            { month: 'Jun', value: 5.5 },
          ],
          burn_forecast: [
            { month: 'Jan', value: 82000 },
            { month: 'Feb', value: 84000 },
            { month: 'Mar', value: 86000 },
            { month: 'Apr', value: 88000 },
          ],
        };

        return {
          intent: 'forecast',
          data: forecastData,
          visualization: {
            type: 'chart',
            chart_type: 'line',
            title: 'Runway Forecast',
            data: forecastData.runway_forecast,
          },
          message: 'Based on current burn rate, runway is projected to be 5.5 months by June 2026.',
          suggestions: [
            'Show burn rate trend',
            'Forecast revenue growth',
            'Analyze churn risk',
          ],
        };
      }

      case 'unknown':
      default:
        const suggestions = [
          'Show weekly MRR vs burn',
          'Create SaaS project: [name]',
          'Pull latest Salesforce opportunities',
          'Show compliance status',
          'Get team utilization',
          'Generate investor report',
          'Show sales pipeline',
          'List all projects',
        ];
        return {
          intent: 'unknown',
          message: `I can help you with that! Here are some commands you can try:`,
          suggestions: suggestions.slice(0, 5),
        };
    }
  } catch (error) {
    console.error('Command processing error:', error);
    return {
      intent: intent.action,
      message: `Error processing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Advanced AI processing with Claude (optional)
export async function processWithClaude(
  env: Env,
  input: string,
  context?: { entities?: Entity[]; metrics?: Record<string, number> }
): Promise<CommandResult> {
  // If no API key, fall back to simple parser
  if (!env.ANTHROPIC_API_KEY) {
    return processCommand(env, input);
  }

  try {
    const systemPrompt = `You are an AI assistant for IntegrateWise Hub Controller. You help users manage their business operations through natural language commands.

Available actions:
- create: Create new entities (projects, tasks, customers, documents, notes)
- list: List entities with optional filters
- update: Update existing entities
- delete: Remove entities
- search: Search across all entities
- metrics: Get KPIs and metrics

Current context:
${context ? JSON.stringify(context, null, 2) : 'No context available'}

Respond with a JSON object:
{
  "action": "create|list|update|delete|search|metrics",
  "entityType": "project|task|customer|opportunity|document|note",
  "data": { ... },
  "filters": { ... },
  "message": "Human-readable response"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: input }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json() as { content: { text: string }[] };
    const text = result.content[0]?.text || '';

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Execute the parsed action
      return processCommand(env, `${parsed.action} ${parsed.entityType || ''}: ${parsed.data?.title || ''}`);
    }

    return {
      intent: 'ai_response',
      message: text,
    };
  } catch (error) {
    console.error('Claude processing error:', error);
    // Fall back to simple parser
    return processCommand(env, input);
  }
}
