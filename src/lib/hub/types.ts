export type KPI = { key: string; value: number; label?: string };

// Entity from API
export type Entity = {
  id: string;
  type: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  parent_id?: string;
  owner?: string;
  source?: string;
  source_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  title: string;
  name?: string; // alias for title
  description?: string;
  category: string;
  status: string;
  priority?: string;
  owner?: string;
  created_at?: string;
  updated_at?: string;
};

export type FinanceSummary = {
  budget: number;
  actual: number;
  burn: number;
  runwayMonths: number;
};

export type DocRef = {
  source: string;
  title: string;
  url: string;
  tags?: string[];
};

export type Opportunity = {
  id: string;
  name: string;
  stage: string;
  amount: number;
  closeDate?: string;
  account?: string;
};

export type Customer = {
  id: string;
  name: string;
  status: string;
  mrr?: number;
  healthScore?: number;
  lastActivity?: string;
};

export type TeamMember = {
  name: string;
  role: string;
  utilization: number;
  status: string;
};

export type Metric = {
  id: string;
  key: string;
  value: number;
  unit?: string;
  category: string;
  period?: string;
  created_at: string;
};

export type CommandResult = {
  intent: string;
  action?: string;
  entities?: Entity[];
  metrics?: Metric[];
  message: string;
  data?: unknown;
};
