import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, Entity, Metric, EntityType } from './types';
import * as db from './db';
import { processCommand, processWithClaude } from './ai';
import {
  financeRoutes,
  complianceRoutes,
  salesRoutes,
  marketingRoutes,
  teamRoutes,
  investorRoutes,
  okrRoutes,
  dashboardRoutes,
  integrationRoutes,
} from './routes';
import { authRoutes } from './auth';
import { taskRoutes } from './routes/tasks';

const app = new Hono<{ Bindings: Env }>();

// CORS for frontend
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'https://hub-controller.pages.dev',
    'https://1d15f5c7.hub-controller.pages.dev',
    'https://controller.integratewise.xyz',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'hub-controller-api', version: '2.1.0' }));
app.get('/api', (c) => c.json({ status: 'ok', version: '2.1.0', modules: [
  'auth', 'entities', 'projects', 'tasks', 'customers', 'opportunities',
  'finance', 'compliance', 'sales', 'marketing', 'team',
  'investors', 'okrs', 'integrations', 'dashboard', 'copilot'
]}));

// Auth routes (public)
app.route('/api/auth', authRoutes);

// Mount comprehensive route modules
app.route('/api/tasks', taskRoutes);
app.route('/api/finance', financeRoutes);
app.route('/api/compliance', complianceRoutes);
app.route('/api/sales', salesRoutes);
app.route('/api/marketing', marketingRoutes);
app.route('/api/team', teamRoutes);
app.route('/api/investors', investorRoutes);
app.route('/api/okrs', okrRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/integrations', integrationRoutes);

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
