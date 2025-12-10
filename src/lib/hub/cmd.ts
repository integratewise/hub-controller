import { api } from './api';
import { CommandResult } from './types';

export async function runCommand(input: string): Promise<CommandResult> {
  // Send to AI command endpoint for processing
  try {
    const result = await api.post('/command', { input }) as CommandResult;
    return result;
  } catch (error) {
    // Fallback to local processing if API fails
    return localProcessCommand(input);
  }
}

async function localProcessCommand(input: string): Promise<CommandResult> {
  const normalized = input.toLowerCase();

  if (normalized.includes('weekly mrr') || normalized.includes('burn')) {
    const data = await api.get('/metrics/kpis?period=week');
    return {
      intent: 'metrics',
      message: 'Here are your weekly MRR and burn metrics',
      data,
      suggestions: ['Show monthly metrics', 'Compare to last week', 'Show burn rate trend'],
    };
  }

  if (normalized.startsWith('create saas project') || normalized.startsWith('create project')) {
    const name = input.split(':')[1]?.trim() || 'Untitled';
    const data = await api.post('/projects', { category: 'SaaS', title: name, status: 'active' });
    return {
      intent: 'create',
      message: `Project "${name}" created successfully`,
      data,
      suggestions: ['List all projects', 'Create another project', 'View project details'],
    };
  }

  if (normalized.includes('pull latest opportunities') || normalized.includes('pull sfdc opps')) {
    const data = await api.get('/integrations/salesforce/opportunities');
    return {
      intent: 'sync',
      message: 'Salesforce opportunities synced successfully',
      data,
      suggestions: ['Show pipeline value', 'View top opportunities', 'Filter by stage'],
    };
  }

  if (normalized.includes('index docs') || normalized.includes('sync docs')) {
    const data = await api.get('/integrations/index/docs');
    return {
      intent: 'sync',
      message: 'Documents indexed successfully',
      data,
      suggestions: ['Search docs', 'Show recent documents', 'Sync Notion'],
    };
  }

  if (normalized.includes('show customers') || normalized.includes('list customers')) {
    const data = await api.get('/customers');
    return {
      intent: 'list',
      message: 'Here are your customers',
      data,
      suggestions: ['Filter by status', 'Show at-risk customers', 'Export customer list'],
    };
  }

  if (normalized.includes('show projects') || normalized.includes('list projects')) {
    const data = await api.get('/projects');
    return {
      intent: 'list',
      message: 'Here are your projects',
      data,
      suggestions: ['Filter by category', 'Show active projects', 'Create new project'],
    };
  }

  if (normalized.includes('finance summary') || normalized.includes('burn rate')) {
    const data = await api.get('/finance/summary');
    return {
      intent: 'metrics',
      message: 'Here is your finance summary',
      data,
      suggestions: ['Show monthly expenses', 'Compare to budget', 'View runway'],
    };
  }

  if (normalized.includes('team utilization') || normalized.includes('utilization')) {
    const data = await api.get('/team/utilization');
    return {
      intent: 'metrics',
      message: 'Here are your team utilization metrics',
      data,
      suggestions: ['Show by team member', 'View billable hours', 'Compare to last month'],
    };
  }

  if (normalized.includes('search')) {
    const query = normalized.replace('search', '').trim();
    const data = await api.get(`/entities/search?q=${encodeURIComponent(query)}`);
    return {
      intent: 'search',
      message: `Search results for "${query}"`,
      data,
      suggestions: ['Refine search', 'Filter by type', 'Sort by date'],
    };
  }

  // Default message
  return {
    intent: 'unknown',
    message: 'Command not recognized. Try: Show projects, Create project: My Project, Search customers, Show metrics',
    suggestions: ['Show MRR vs burn', 'Create project', 'Show pipeline', 'List customers'],
  };
}
