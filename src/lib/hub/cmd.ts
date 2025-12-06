import { api } from './api';

export async function runCommand(input: string) {
  const normalized = input.toLowerCase();
  
  if (normalized.includes('weekly mrr') || normalized.includes('burn')) {
    return api.get('/metrics/kpis?period=week');
  }
  
  if (normalized.startsWith('create saas project')) {
    const name = input.split(':')[1]?.trim() || 'Untitled';
    return api.post('/projects', { category: 'SaaS', name, status: 'Planned' });
  }
  
  if (normalized.includes('pull latest opportunities') || normalized.includes('pull sfdc opps')) {
    return api.get('/integrations/salesforce/opportunities');
  }
  
  if (normalized.includes('index docs') || normalized.includes('sync docs')) {
    return Promise.all([
      api.get('/integrations/notion/docs'),
      api.get('/integrations/coda/docs')
    ]);
  }
  
  if (normalized.includes('show customers') || normalized.includes('list customers')) {
    return api.get('/customers');
  }
  
  if (normalized.includes('finance summary') || normalized.includes('burn rate')) {
    return api.get('/finance/summary');
  }
  
  if (normalized.includes('team utilization') || normalized.includes('utilization')) {
    return api.get('/team/utilization');
  }
  
  // Default echo
  return { 
    message: 'Command not recognized. Try: Show weekly MRR vs burn, Create SaaS project: Billing revamp, Pull latest opportunities' 
  };
}

