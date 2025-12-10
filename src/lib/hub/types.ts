// Hub Controller Frontend Types
// Comprehensive type definitions for the Universal Controller

// ============================================
// AUTH & MULTI-TENANCY
// ============================================

export type Organization = {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  billing_email?: string;
  settings?: OrgSettings;
  created_at: string;
  updated_at: string;
};

export type OrgSettings = {
  branding?: {
    primary_color?: string;
    logo_url?: string;
  };
  features?: {
    meetings_enabled?: boolean;
    docs_enabled?: boolean;
    crm_enabled?: boolean;
  };
  limits?: {
    max_users?: number;
    max_projects?: number;
  };
};

export type User = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type OrgMember = {
  id: string;
  org_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
  invited_by?: string;
  invited_at?: string;
  joined_at?: string;
  created_at: string;
};

export type AuthState = {
  user: User | null;
  organization: Organization | null;
  organizations: Organization[];
  role: OrgMember['role'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export type AuthResponse = {
  token: string;
  user: User;
  organizations: Organization[];
};

// ============================================
// TASKS & KANBAN
// ============================================

export type TaskBoard = {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  columns: TaskColumn[];
  settings?: BoardSettings;
  created_at: string;
  updated_at: string;
};

export type TaskColumn = {
  id: string;
  name: string;
  color?: string;
  order: number;
};

export type BoardSettings = {
  default_assignee?: string;
  auto_archive_days?: number;
  allow_subtasks?: boolean;
};

export type Task = {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id?: string;
  assignee?: User;
  due_date?: string;
  labels?: string[];
  order: number;
  parent_id?: string;
  subtasks?: Task[];
  comments_count?: number;
  attachments_count?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

export type TaskComment = {
  id: string;
  task_id: string;
  user_id: string;
  user?: User;
  content: string;
  created_at: string;
  updated_at: string;
};

// ============================================
// KPIs & METRICS
// ============================================

export type KPI = { 
  key: string; 
  value: number; 
  label?: string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable' | 'flat';
  change_percent?: number;
  category?: string;
};

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
  name?: string;
  description?: string;
  category: ProjectCategory;
  status: string;
  priority?: string;
  owner?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProjectCategory =
  | 'startup_launch'
  | 'saas'
  | 'services'
  | 'internal'
  | 'poc'
  | 'maintenance'
  | 'integration'
  | 'innovation';

export type FinanceSummary = {
  mrr: number;
  arr: number;
  burn: number;
  runway_months: number;
  budget_total: number;
  budget_spent: number;
  outstanding_invoices: number;
  cash_balance: number;
  revenue_ytd: number;
  expenses_ytd: number;
};

export type SalesMetrics = {
  pipeline_value: number;
  pipeline_count: number;
  won_this_month: number;
  won_value_this_month: number;
  lost_this_month: number;
  avg_deal_size: number;
  win_rate: number;
  avg_sales_cycle_days: number;
  cac: number;
};

export type MarketingMetrics = {
  website_visitors: number;
  leads_this_month: number;
  mql_count: number;
  sql_count: number;
  conversion_rate: number;
  cac: number;
  ltv_cac_ratio: number;
  content_pieces: number;
  social_followers: number;
};

export type TeamMetrics = {
  total_members: number;
  utilization_avg: number;
  billable_hours_this_month: number;
  non_billable_hours_this_month: number;
  capacity_hours: number;
  headcount_growth: number;
};

export type ComplianceSummary = {
  total_controls: number;
  compliant: number;
  pending: number;
  at_risk: number;
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
  probability?: number;
  closeDate?: string;
  account?: string;
  owner?: string;
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
  id?: string;
  name: string;
  role: string;
  department?: string;
  utilization: number;
  utilization_target?: number;
  status: string;
};

export type Metric = {
  id: string;
  key: string;
  value: number;
  unit?: string;
  category: string;
  period?: string;
  trend?: 'up' | 'down' | 'stable';
  change_percent?: number;
  created_at: string;
};

export type MetricTrend = {
  key: string;
  current: number;
  previous: number;
  change: number;
  change_percent: number;
  trend: 'up' | 'down' | 'stable';
  series: { date: string; value: number }[];
};

// Copilot types
export type CopilotIntent =
  | 'create'
  | 'list'
  | 'update'
  | 'delete'
  | 'search'
  | 'metrics'
  | 'report'
  | 'sync'
  | 'compliance'
  | 'forecast'
  | 'analyze'
  | 'unknown';

export type VisualizationType = 'chart' | 'table' | 'kpi_cards' | 'timeline';
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';

export type VisualizationSpec = {
  type: VisualizationType;
  chart_type?: ChartType;
  title: string;
  data: unknown;
  config?: Record<string, unknown>;
};

export type CommandResult = {
  intent: CopilotIntent;
  action?: string;
  entities?: Entity[];
  metrics?: Metric[];
  message: string;
  data?: unknown;
  suggestions?: string[];
  visualization?: VisualizationSpec;
};

// Dashboard types
export type DashboardSummary = {
  finance: FinanceSummary;
  sales: SalesMetrics;
  marketing: MarketingMetrics;
  team: TeamMetrics;
  compliance: ComplianceSummary;
  recent_activities: Activity[];
  upcoming_deadlines: Entity[];
};

export type Activity = {
  id: string;
  entity_id?: string;
  action: string;
  actor?: string;
  details?: Record<string, unknown>;
  created_at: string;
};

// Integration types
export type IntegrationStatus = {
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error' | 'pending_auth';
  last_sync?: string;
};

// OKR types
export type Objective = {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  category: 'company' | 'team' | 'individual';
  status: string;
  progress: number;
  start_date?: string;
  end_date?: string;
  key_results?: KeyResult[];
};

export type KeyResult = {
  id: string;
  objective_id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit?: string;
  status: string;
};

// Compliance types
export type ComplianceItem = {
  id: string;
  framework: string;
  control_id: string;
  title: string;
  description?: string;
  status: string;
  evidence_url?: string;
  owner?: string;
  due_date?: string;
};

export type GSTFiling = {
  id: string;
  filing_type: string;
  period: string;
  status: string;
  amount: number;
  filed_date?: string;
  due_date?: string;
};

export type ROCFiling = {
  id: string;
  form_type: string;
  financial_year: string;
  status: string;
  filed_date?: string;
  due_date?: string;
  srn_number?: string;
};
