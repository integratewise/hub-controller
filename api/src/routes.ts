// Comprehensive API Routes for Universal Controller Hub
// All endpoints for the IntegrateWise platform

import { Hono } from 'hono';
import { Env } from './types';
import * as db from './db';

// Create route groups
export const financeRoutes = new Hono<{ Bindings: Env }>();
export const complianceRoutes = new Hono<{ Bindings: Env }>();
export const salesRoutes = new Hono<{ Bindings: Env }>();
export const marketingRoutes = new Hono<{ Bindings: Env }>();
export const teamRoutes = new Hono<{ Bindings: Env }>();
export const investorRoutes = new Hono<{ Bindings: Env }>();
export const okrRoutes = new Hono<{ Bindings: Env }>();
export const dashboardRoutes = new Hono<{ Bindings: Env }>();
export const integrationRoutes = new Hono<{ Bindings: Env }>();

// ============================================
// FINANCE ROUTES
// ============================================

financeRoutes.get('/summary', async (c) => {
  const metrics = await db.getLatestMetrics(c.env.DB, 'finance');
  return c.json({
    mrr: metrics.mrr || 120000,
    arr: metrics.arr || 1440000,
    burn: metrics.burn || 80000,
    runway_months: metrics.runway || 9,
    budget_total: metrics.budget_total || 1000000,
    budget_spent: metrics.budget_spent || 750000,
    outstanding_invoices: metrics.outstanding_invoices || 45000,
    cash_balance: metrics.cash_balance || 720000,
    revenue_ytd: metrics.revenue_ytd || 980000,
    expenses_ytd: metrics.expenses_ytd || 640000,
  });
});

financeRoutes.get('/transactions', async (c) => {
  const type = c.req.query('type');
  const category = c.req.query('category');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  
  // Query from entities table with type=finance
  const entities = await db.listEntities(c.env.DB, { type: 'finance' });
  
  const transactions = entities
    .filter(e => {
      if (type && (e.metadata as Record<string, string>)?.entryType !== type) return false;
      if (category && e.category !== category) return false;
      return true;
    })
    .map(e => ({
      id: e.id,
      type: (e.metadata as Record<string, string>)?.entryType || 'expense',
      category: e.category || 'General',
      amount: (e.metadata as Record<string, number>)?.amount || 0,
      currency: 'INR',
      description: e.title,
      transaction_date: (e.metadata as Record<string, string>)?.date || e.created_at,
      created_at: e.created_at,
    }));
  
  return c.json(transactions);
});

financeRoutes.get('/budgets', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'finance', category: 'budget' });
  
  return c.json(entities.map(e => ({
    id: e.id,
    name: e.title,
    category: (e.metadata as Record<string, string>)?.budgetCategory || 'General',
    allocated: (e.metadata as Record<string, number>)?.allocated || 0,
    spent: (e.metadata as Record<string, number>)?.spent || 0,
    period_type: (e.metadata as Record<string, string>)?.period_type || 'monthly',
  })));
});

financeRoutes.get('/invoices', async (c) => {
  const status = c.req.query('status');
  const customerId = c.req.query('customer_id');
  
  const entities = await db.listEntities(c.env.DB, { type: 'finance' });
  
  const invoices = entities
    .filter(e => (e.metadata as Record<string, string>)?.invoiceNumber)
    .filter(e => !status || e.status === status)
    .map(e => ({
      id: e.id,
      invoice_number: (e.metadata as Record<string, string>)?.invoiceNumber,
      customer_id: (e.metadata as Record<string, string>)?.customerId,
      amount: (e.metadata as Record<string, number>)?.amount || 0,
      tax: (e.metadata as Record<string, number>)?.tax || 0,
      total: (e.metadata as Record<string, number>)?.total || 0,
      status: e.status,
      issue_date: (e.metadata as Record<string, string>)?.issueDate,
      due_date: e.due_date,
    }));
  
  return c.json(invoices);
});

financeRoutes.get('/metrics/trend', async (c) => {
  const metricKey = c.req.query('key') || 'mrr';
  const period = c.req.query('period') || 'month';
  
  // Return mock trend data - in production, fetch from BigQuery
  const mockTrend = {
    key: metricKey,
    current: 120000,
    previous: 110000,
    change: 10000,
    change_percent: 9.09,
    trend: 'up',
    series: [
      { date: '2025-09-01', value: 100000 },
      { date: '2025-10-01', value: 105000 },
      { date: '2025-11-01', value: 110000 },
      { date: '2025-12-01', value: 120000 },
    ],
  };
  
  return c.json(mockTrend);
});

// ============================================
// COMPLIANCE ROUTES
// ============================================

complianceRoutes.get('/summary', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'compliance' });
  
  const summary = {
    total_controls: entities.length || 45,
    compliant: entities.filter(e => e.status === 'completed').length || 38,
    pending: entities.filter(e => e.status === 'pending').length || 5,
    at_risk: entities.filter(e => e.status === 'blocked').length || 2,
    frameworks: {
      soc2: { total: 12, compliant: 10 },
      gdpr: { total: 8, compliant: 7 },
      iso27001: { total: 15, compliant: 12 },
      gst: { total: 5, compliant: 5 },
      roc: { total: 5, compliant: 4 },
    },
  };
  
  return c.json(summary);
});

complianceRoutes.get('/items', async (c) => {
  const framework = c.req.query('framework');
  const status = c.req.query('status');
  
  const entities = await db.listEntities(c.env.DB, { type: 'compliance' });
  
  const items = entities
    .filter(e => !framework || e.category === framework)
    .filter(e => !status || e.status === status)
    .map(e => ({
      id: e.id,
      framework: e.category || 'soc2',
      control_id: (e.metadata as Record<string, string>)?.controlId || '',
      title: e.title,
      description: e.description,
      status: e.status,
      evidence_url: (e.metadata as Record<string, string>)?.evidenceUrl,
      owner: e.owner,
      due_date: e.due_date,
      last_reviewed: (e.metadata as Record<string, string>)?.lastReviewed,
    }));
  
  return c.json(items);
});

complianceRoutes.get('/gst/filings', async (c) => {
  const period = c.req.query('period');
  
  // Mock GST filings - in production, query from gst_filings table
  const filings = [
    { id: '1', filing_type: 'GSTR3B', period: '2025-11', status: 'filed', amount: 45000, due_date: '2025-12-20' },
    { id: '2', filing_type: 'GSTR1', period: '2025-11', status: 'filed', amount: 0, due_date: '2025-12-11' },
    { id: '3', filing_type: 'GSTR3B', period: '2025-12', status: 'pending', amount: 48000, due_date: '2026-01-20' },
  ];
  
  return c.json(filings);
});

complianceRoutes.get('/roc/filings', async (c) => {
  const fy = c.req.query('financial_year');
  
  // Mock ROC filings
  const filings = [
    { id: '1', form_type: 'AOC-4', financial_year: '2024-25', status: 'filed', filed_date: '2025-10-30', due_date: '2025-10-30' },
    { id: '2', form_type: 'MGT-7', financial_year: '2024-25', status: 'filed', filed_date: '2025-11-29', due_date: '2025-11-29' },
    { id: '3', form_type: 'DIR-3 KYC', financial_year: '2025-26', status: 'pending', due_date: '2025-09-30' },
  ];
  
  return c.json(filings);
});

complianceRoutes.post('/items', async (c) => {
  const data = await c.req.json();
  
  const entity = await db.createEntity(c.env.DB, {
    type: 'compliance',
    title: data.title,
    description: data.description,
    status: data.status || 'pending',
    priority: data.priority || 'medium',
    category: data.framework,
    owner: data.owner,
    due_date: data.due_date,
    metadata: {
      controlId: data.control_id,
      evidenceUrl: data.evidence_url,
    },
  });
  
  return c.json(entity, 201);
});

// ============================================
// SALES ROUTES
// ============================================

salesRoutes.get('/summary', async (c) => {
  const metrics = await db.getLatestMetrics(c.env.DB, 'sales');
  
  return c.json({
    pipeline_value: metrics.pipeline_value || 850000,
    pipeline_count: metrics.pipeline_count || 24,
    won_this_month: metrics.won_this_month || 3,
    won_value_this_month: metrics.won_value_this_month || 125000,
    lost_this_month: metrics.lost_this_month || 1,
    avg_deal_size: metrics.avg_deal_size || 45000,
    win_rate: metrics.win_rate || 35,
    avg_sales_cycle_days: metrics.avg_sales_cycle || 45,
    cac: metrics.cac || 12000,
  });
});

salesRoutes.get('/opportunities', async (c) => {
  const stage = c.req.query('stage');
  const owner = c.req.query('owner');
  
  const entities = await db.listEntities(c.env.DB, { type: 'opportunity' });
  
  const opportunities = entities
    .filter(e => !stage || e.status === stage)
    .filter(e => !owner || e.owner === owner)
    .map(e => ({
      id: e.id,
      name: e.title,
      account: (e.metadata as Record<string, string>)?.account,
      stage: e.status,
      amount: (e.metadata as Record<string, number>)?.amount || 0,
      probability: (e.metadata as Record<string, number>)?.probability || 0,
      close_date: e.due_date,
      owner: e.owner,
      source: e.source,
      created_at: e.created_at,
    }));
  
  return c.json(opportunities);
});

salesRoutes.get('/pipeline', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'opportunity' });
  
  // Group by stage
  const stages = ['prospecting', 'qualification', 'needs_analysis', 'proposal', 'negotiation'];
  const pipeline = stages.map(stage => {
    const stageOpps = entities.filter(e => e.status === stage);
    return {
      stage,
      count: stageOpps.length,
      value: stageOpps.reduce((sum, e) => sum + ((e.metadata as Record<string, number>)?.amount || 0), 0),
    };
  });
  
  return c.json(pipeline);
});

salesRoutes.post('/opportunities', async (c) => {
  const data = await c.req.json();
  
  const entity = await db.createEntity(c.env.DB, {
    type: 'opportunity',
    title: data.name,
    status: data.stage || 'prospecting',
    priority: 'medium',
    owner: data.owner,
    due_date: data.close_date,
    source: data.source || 'manual',
    metadata: {
      account: data.account,
      amount: data.amount,
      probability: data.probability || 10,
    },
  });
  
  return c.json(entity, 201);
});

// ============================================
// MARKETING ROUTES
// ============================================

marketingRoutes.get('/summary', async (c) => {
  const metrics = await db.getLatestMetrics(c.env.DB, 'marketing');
  
  return c.json({
    website_visitors: metrics.visitors || 15000,
    leads_this_month: metrics.leads || 180,
    mql_count: metrics.mqls || 45,
    sql_count: metrics.sqls || 18,
    conversion_rate: metrics.conversion_rate || 3.5,
    cac: metrics.cac || 12000,
    ltv_cac_ratio: metrics.ltv_cac_ratio || 3.2,
    content_pieces: metrics.content || 24,
    social_followers: metrics.social_followers || 5200,
  });
});

marketingRoutes.get('/campaigns', async (c) => {
  const status = c.req.query('status');
  
  const entities = await db.listEntities(c.env.DB, { type: 'marketing_campaign' });
  
  const campaigns = entities
    .filter(e => !status || e.status === status)
    .map(e => ({
      id: e.id,
      name: e.title,
      type: e.category,
      status: e.status,
      budget: (e.metadata as Record<string, number>)?.budget || 0,
      spent: (e.metadata as Record<string, number>)?.spent || 0,
      start_date: (e.metadata as Record<string, string>)?.startDate,
      end_date: (e.metadata as Record<string, string>)?.endDate,
      metrics: (e.metadata as Record<string, unknown>)?.metrics || {},
      owner: e.owner,
    }));
  
  return c.json(campaigns);
});

marketingRoutes.post('/campaigns', async (c) => {
  const data = await c.req.json();
  
  const entity = await db.createEntity(c.env.DB, {
    type: 'marketing_campaign',
    title: data.name,
    status: data.status || 'draft',
    priority: 'medium',
    category: data.type,
    owner: data.owner,
    metadata: {
      budget: data.budget,
      spent: 0,
      startDate: data.start_date,
      endDate: data.end_date,
      targetAudience: data.target_audience,
      channels: data.channels,
    },
  });
  
  return c.json(entity, 201);
});

// ============================================
// TEAM ROUTES
// ============================================

teamRoutes.get('/summary', async (c) => {
  const metrics = await db.getLatestMetrics(c.env.DB, 'team');
  const entities = await db.listEntities(c.env.DB, { type: 'team_member' });
  
  return c.json({
    total_members: entities.length || 12,
    utilization_avg: metrics.utilization || 72,
    billable_hours_this_month: metrics.billable_hours || 1440,
    non_billable_hours_this_month: metrics.non_billable_hours || 560,
    capacity_hours: metrics.capacity || 2000,
    headcount_growth: metrics.headcount_growth || 15,
  });
});

teamRoutes.get('/members', async (c) => {
  const department = c.req.query('department');
  const status = c.req.query('status');
  
  const entities = await db.listEntities(c.env.DB, { type: 'team_member' });
  
  const members = entities
    .filter(e => !department || e.category === department)
    .filter(e => !status || e.status === status)
    .map(e => ({
      id: e.id,
      name: e.title,
      email: (e.metadata as Record<string, string>)?.email,
      role: (e.metadata as Record<string, string>)?.role || e.category,
      department: e.category,
      status: e.status,
      utilization_target: (e.metadata as Record<string, number>)?.utilizationTarget || 80,
      utilization_actual: (e.metadata as Record<string, number>)?.utilizationActual || 0,
      start_date: (e.metadata as Record<string, string>)?.startDate,
    }));
  
  return c.json(members);
});

teamRoutes.get('/utilization', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'team_member' });
  
  const utilization = entities.map(e => ({
    member_id: e.id,
    name: e.title,
    target: (e.metadata as Record<string, number>)?.utilizationTarget || 80,
    actual: (e.metadata as Record<string, number>)?.utilizationActual || 0,
    billable_hours: (e.metadata as Record<string, number>)?.billableHours || 0,
    total_hours: (e.metadata as Record<string, number>)?.totalHours || 0,
  }));
  
  const overall = utilization.length > 0
    ? Math.round(utilization.reduce((sum, u) => sum + u.actual, 0) / utilization.length)
    : 72;
  
  return c.json({ overall, members: utilization });
});

teamRoutes.post('/members', async (c) => {
  const data = await c.req.json();
  
  const entity = await db.createEntity(c.env.DB, {
    type: 'team_member',
    title: data.name,
    status: 'active',
    priority: 'medium',
    category: data.department,
    metadata: {
      email: data.email,
      role: data.role,
      employmentType: data.employment_type || 'full_time',
      startDate: data.start_date,
      utilizationTarget: data.utilization_target || 80,
      hourlyRate: data.hourly_rate,
      skills: data.skills,
    },
  });
  
  return c.json(entity, 201);
});

// ============================================
// INVESTOR ROUTES
// ============================================

investorRoutes.get('/summary', async (c) => {
  const investorEntities = await db.listEntities(c.env.DB, { type: 'investor' });
  
  return c.json({
    total_investors: investorEntities.length || 5,
    total_raised: investorEntities.reduce((sum, e) => 
      sum + ((e.metadata as Record<string, number>)?.investedAmount || 0), 0) || 500000,
    current_round: 'Seed',
    target_amount: 1000000,
    raised_amount: 500000,
    valuation: 5000000,
  });
});

investorRoutes.get('/list', async (c) => {
  const status = c.req.query('status');
  
  const entities = await db.listEntities(c.env.DB, { type: 'investor' });
  
  const investors = entities
    .filter(e => !status || e.status === status)
    .map(e => ({
      id: e.id,
      name: e.title,
      type: e.category,
      contact_name: (e.metadata as Record<string, string>)?.contactName,
      email: (e.metadata as Record<string, string>)?.email,
      firm: (e.metadata as Record<string, string>)?.firm,
      status: e.status,
      invested_amount: (e.metadata as Record<string, number>)?.investedAmount || 0,
      equity_percentage: (e.metadata as Record<string, number>)?.equityPercentage || 0,
    }));
  
  return c.json(investors);
});

investorRoutes.get('/documents', async (c) => {
  const type = c.req.query('type');
  
  const entities = await db.listEntities(c.env.DB, { type: 'document', category: 'investor' });
  
  const documents = entities
    .filter(e => !type || (e.metadata as Record<string, string>)?.docType === type)
    .map(e => ({
      id: e.id,
      title: e.title,
      type: (e.metadata as Record<string, string>)?.docType || 'pitch_deck',
      version: (e.metadata as Record<string, string>)?.version,
      file_url: (e.metadata as Record<string, string>)?.fileUrl,
      status: e.status,
      created_at: e.created_at,
      updated_at: e.updated_at,
    }));
  
  return c.json(documents);
});

investorRoutes.get('/updates', async (c) => {
  // Monthly investor updates
  const entities = await db.listEntities(c.env.DB, { type: 'document' });
  
  const updates = entities
    .filter(e => (e.metadata as Record<string, string>)?.docType === 'investor_update')
    .map(e => ({
      id: e.id,
      title: e.title,
      period: (e.metadata as Record<string, string>)?.period,
      status: e.status,
      sent_date: (e.metadata as Record<string, string>)?.sentDate,
      created_at: e.created_at,
    }));
  
  return c.json(updates);
});

// ============================================
// OKR ROUTES
// ============================================

okrRoutes.get('/summary', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'okr' });
  
  const objectives = entities.filter(e => !(e.metadata as Record<string, string>)?.objectiveId);
  const keyResults = entities.filter(e => (e.metadata as Record<string, string>)?.objectiveId);
  
  return c.json({
    total_objectives: objectives.length || 6,
    completed_objectives: objectives.filter(e => e.status === 'completed').length,
    avg_progress: objectives.length > 0
      ? Math.round(objectives.reduce((sum, e) => sum + ((e.metadata as Record<string, number>)?.progress || 0), 0) / objectives.length)
      : 65,
    key_results_on_track: keyResults.filter(e => e.status === 'active').length,
    key_results_at_risk: keyResults.filter(e => e.status === 'blocked').length,
  });
});

okrRoutes.get('/objectives', async (c) => {
  const category = c.req.query('category'); // company, team, individual
  
  const entities = await db.listEntities(c.env.DB, { type: 'okr' });
  
  const objectives = entities
    .filter(e => !(e.metadata as Record<string, string>)?.objectiveId)
    .filter(e => !category || e.category === category)
    .map(e => {
      const keyResults = entities
        .filter(kr => (kr.metadata as Record<string, string>)?.objectiveId === e.id)
        .map(kr => ({
          id: kr.id,
          title: kr.title,
          target_value: (kr.metadata as Record<string, number>)?.targetValue || 100,
          current_value: (kr.metadata as Record<string, number>)?.currentValue || 0,
          unit: (kr.metadata as Record<string, string>)?.unit,
          status: kr.status,
        }));
      
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        owner: e.owner,
        category: e.category,
        status: e.status,
        progress: (e.metadata as Record<string, number>)?.progress || 0,
        start_date: (e.metadata as Record<string, string>)?.startDate,
        end_date: e.due_date,
        key_results: keyResults,
      };
    });
  
  return c.json(objectives);
});

okrRoutes.post('/objectives', async (c) => {
  const data = await c.req.json();
  
  const entity = await db.createEntity(c.env.DB, {
    type: 'okr',
    title: data.title,
    description: data.description,
    status: 'active',
    priority: 'medium',
    category: data.category || 'company',
    owner: data.owner,
    due_date: data.end_date,
    metadata: {
      progress: 0,
      startDate: data.start_date,
    },
  });
  
  return c.json(entity, 201);
});

okrRoutes.post('/key-results', async (c) => {
  const data = await c.req.json();
  
  const entity = await db.createEntity(c.env.DB, {
    type: 'okr',
    title: data.title,
    description: data.description,
    status: 'active',
    priority: 'medium',
    owner: data.owner,
    due_date: data.due_date,
    metadata: {
      objectiveId: data.objective_id,
      targetValue: data.target_value,
      currentValue: 0,
      unit: data.unit,
    },
  });
  
  return c.json(entity, 201);
});

// ============================================
// DASHBOARD ROUTES
// ============================================

dashboardRoutes.get('/summary', async (c) => {
  // Aggregate all key metrics
  const financeMetrics = await db.getLatestMetrics(c.env.DB, 'finance');
  const salesMetrics = await db.getLatestMetrics(c.env.DB, 'sales');
  const marketingMetrics = await db.getLatestMetrics(c.env.DB, 'marketing');
  const teamMetrics = await db.getLatestMetrics(c.env.DB, 'team');
  
  const complianceEntities = await db.listEntities(c.env.DB, { type: 'compliance' });
  const activities = await db.getActivities(c.env.DB, undefined, 10);
  const entities = await db.listEntities(c.env.DB, { limit: 10 });
  
  // Get upcoming deadlines
  const upcomingDeadlines = entities
    .filter(e => e.due_date && new Date(e.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);
  
  return c.json({
    finance: {
      mrr: financeMetrics.mrr || 120000,
      arr: financeMetrics.arr || 1440000,
      burn: financeMetrics.burn || 80000,
      runway_months: financeMetrics.runway || 9,
      budget_total: financeMetrics.budget_total || 1000000,
      budget_spent: financeMetrics.budget_spent || 750000,
      outstanding_invoices: financeMetrics.outstanding_invoices || 45000,
      cash_balance: financeMetrics.cash_balance || 720000,
      revenue_ytd: financeMetrics.revenue_ytd || 980000,
      expenses_ytd: financeMetrics.expenses_ytd || 640000,
    },
    sales: {
      pipeline_value: salesMetrics.pipeline_value || 850000,
      pipeline_count: salesMetrics.pipeline_count || 24,
      won_this_month: salesMetrics.won_this_month || 3,
      won_value_this_month: salesMetrics.won_value_this_month || 125000,
      lost_this_month: salesMetrics.lost_this_month || 1,
      avg_deal_size: salesMetrics.avg_deal_size || 45000,
      win_rate: salesMetrics.win_rate || 35,
      avg_sales_cycle_days: salesMetrics.avg_sales_cycle || 45,
      cac: salesMetrics.cac || 12000,
    },
    marketing: {
      website_visitors: marketingMetrics.visitors || 15000,
      leads_this_month: marketingMetrics.leads || 180,
      mql_count: marketingMetrics.mqls || 45,
      sql_count: marketingMetrics.sqls || 18,
      conversion_rate: marketingMetrics.conversion_rate || 3.5,
      cac: marketingMetrics.cac || 12000,
      ltv_cac_ratio: marketingMetrics.ltv_cac_ratio || 3.2,
      content_pieces: marketingMetrics.content || 24,
      social_followers: marketingMetrics.social_followers || 5200,
    },
    team: {
      total_members: teamMetrics.total_members || 12,
      utilization_avg: teamMetrics.utilization || 72,
      billable_hours_this_month: teamMetrics.billable_hours || 1440,
      non_billable_hours_this_month: teamMetrics.non_billable_hours || 560,
      capacity_hours: teamMetrics.capacity || 2000,
      headcount_growth: teamMetrics.headcount_growth || 15,
    },
    compliance: {
      total_controls: complianceEntities.length || 45,
      compliant: complianceEntities.filter(e => e.status === 'completed').length || 38,
      pending: complianceEntities.filter(e => e.status === 'pending').length || 5,
      at_risk: complianceEntities.filter(e => e.status === 'blocked').length || 2,
    },
    recent_activities: activities,
    upcoming_deadlines: upcomingDeadlines,
  });
});

dashboardRoutes.get('/kpis', async (c) => {
  const category = c.req.query('category');
  
  if (category) {
    const metrics = await db.getLatestMetrics(c.env.DB, category);
    return c.json(
      Object.entries(metrics).map(([key, value]) => ({ key, value }))
    );
  }
  
  // Return all key KPIs
  const financeMetrics = await db.getLatestMetrics(c.env.DB, 'finance');
  const salesMetrics = await db.getLatestMetrics(c.env.DB, 'sales');
  const teamMetrics = await db.getLatestMetrics(c.env.DB, 'team');
  
  return c.json([
    { key: 'MRR', value: financeMetrics.mrr || 120000, category: 'finance' },
    { key: 'ARR', value: financeMetrics.arr || 1440000, category: 'finance' },
    { key: 'Burn', value: financeMetrics.burn || 80000, category: 'finance' },
    { key: 'Runway', value: financeMetrics.runway || 9, category: 'finance', unit: 'months' },
    { key: 'Pipeline', value: salesMetrics.pipeline_value || 850000, category: 'sales' },
    { key: 'Win Rate', value: salesMetrics.win_rate || 35, category: 'sales', unit: '%' },
    { key: 'Utilization', value: teamMetrics.utilization || 72, category: 'team', unit: '%' },
    { key: 'Team Size', value: teamMetrics.total_members || 12, category: 'team' },
  ]);
});

// ============================================
// INTEGRATION ROUTES
// ============================================

integrationRoutes.get('/list', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM integrations ORDER BY name').all();
  return c.json(result.results || []);
});

integrationRoutes.get('/status', async (c) => {
  // Return status of all integrations
  const integrations = [
    { name: 'Salesforce', type: 'salesforce', status: 'active', last_sync: '2025-12-06T10:00:00Z' },
    { name: 'Notion', type: 'notion', status: 'active', last_sync: '2025-12-06T09:30:00Z' },
    { name: 'Google Drive', type: 'google_drive', status: 'active', last_sync: '2025-12-06T08:00:00Z' },
    { name: 'Zoho Books', type: 'zoho_books', status: 'pending_auth', last_sync: null },
    { name: 'Slack', type: 'slack', status: 'active', last_sync: '2025-12-06T10:30:00Z' },
    { name: 'Airtable', type: 'airtable', status: 'inactive', last_sync: '2025-11-15T00:00:00Z' },
  ];
  
  return c.json(integrations);
});

integrationRoutes.post('/sync', async (c) => {
  const { integration, sync_type, entity_types } = await c.req.json();
  
  // Queue sync task (in production, publish to Pub/Sub)
  const syncId = crypto.randomUUID();
  
  return c.json({
    sync_id: syncId,
    integration,
    sync_type: sync_type || 'incremental',
    status: 'queued',
    message: `Sync task queued for ${integration}`,
  });
});

// Salesforce specific endpoints
integrationRoutes.get('/salesforce/opportunities', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'opportunity', source: 'salesforce' });
  
  const opportunities = entities.map(e => ({
    id: e.id,
    name: e.title,
    account: (e.metadata as Record<string, string>)?.account,
    stage: e.status,
    amount: (e.metadata as Record<string, number>)?.amount || 0,
    close_date: e.due_date,
    source_id: e.source_id,
  }));
  
  return c.json(opportunities);
});

integrationRoutes.get('/salesforce/accounts', async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: 'customer', source: 'salesforce' });
  
  return c.json(entities.map(e => ({
    id: e.id,
    name: e.title,
    type: e.category,
    status: e.status,
    source_id: e.source_id,
  })));
});
