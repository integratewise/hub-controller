import { api } from './api';

export async function runCommand(input: string) {
  // Send to AI command endpoint for processing
  try {
    const result = await api.post('/command', { input });
    return result;
  } catch (error) {
    // Fallback to local processing if API fails
    return localProcessCommand(input);
  }
}

function localProcessCommand(input: string) {
  const normalized = input.toLowerCase();

  if (normalized.includes('weekly mrr') || normalized.includes('burn')) {
    return api.get('/metrics/kpis?period=week');
  }

  if (normalized.startsWith('create saas project') || normalized.startsWith('create project')) {
    const name = input.split(':')[1]?.trim() || 'Untitled';
    return api.post('/projects', { category: 'SaaS', title: name, status: 'active' });
  }

  if (normalized.includes('pull latest opportunities') || normalized.includes('pull sfdc opps')) {
    return api.get('/integrations/salesforce/opportunities');
  }

  if (normalized.includes('index docs') || normalized.includes('sync docs')) {
    return api.get('/integrations/index/docs');
  }

  if (normalized.includes('show customers') || normalized.includes('list customers')) {
    return api.get('/customers');
  }

  if (normalized.includes('show projects') || normalized.includes('list projects')) {
    return api.get('/projects');
  }

  if (normalized.includes('finance summary') || normalized.includes('burn rate')) {
    return api.get('/finance/summary');
  }

  if (normalized.includes('team utilization') || normalized.includes('utilization')) {
    return api.get('/team/utilization');
  }

  if (normalized.includes('search')) {
    const query = normalized.replace('search', '').trim();
    return api.get(`/entities/search?q=${encodeURIComponent(query)}`);
  }

  // Default message
  return Promise.resolve({
    message: 'Command not recognized. Try: Show projects, Create project: My Project, Search customers, Show metrics'
  });
}
