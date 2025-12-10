// Hub Controller API - Comprehensive Types
// Universal Controller Hub Type Definitions

// ============================================
// ENVIRONMENT & CONFIG
// ============================================

export interface Env {
  DB: D1Database;
  AI: Ai;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_CLOUD_PROJECT?: string;
  VERTEX_AI_LOCATION?: string;
  BIGQUERY_DATASET?: string;
  GCS_BUCKET?: string;
  ENVIRONMENT: string;
  JWT_SECRET: string;
}

// ============================================
// AUTH & MULTI-TENANCY
// ============================================

export interface Organization {
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
}

export interface OrgSettings {
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
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
  invited_by?: string;
  invited_at?: string;
  joined_at?: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  org_id?: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

export interface AuthContext {
  user: User;
  org: Organization;
  member: OrgMember;
}

export interface SignupInput {
  email: string;
  password: string;
  name?: string;
  org_name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  organizations: Organization[];
}

// ============================================
// ENTITY TYPES
// ============================================

export type EntityType =
  | 'project'
  | 'task'
  | 'customer'
  | 'opportunity'
  | 'document'
  | 'note'
  | 'metric'
  | 'event'
  | 'team_member'
  | 'compliance'
  | 'rnd'
  | 'finance'
  | 'marketing_campaign'
  | 'lead'
  | 'deal'
  | 'investor'
  | 'okr'
  | 'service'
  | 'startup';

export type EntityStatus = 'active' | 'completed' | 'archived' | 'blocked' | 'pending' | 'draft';
export type Priority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export type ProjectCategory =
  | 'startup_launch'
  | 'saas'
  | 'services'
  | 'internal'
  | 'poc'
  | 'maintenance'
  | 'integration'
  | 'innovation';

// ============================================
// CORE ENTITIES
// ============================================

export interface Entity {
  id: string;
  type: EntityType;
  title: string;
  description?: string;
  status: EntityStatus;
  priority: Priority;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  parent_id?: string;
  owner?: string;
  source?: IntegrationSource;
  source_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Metric {
  id: string;
  key: string;
  value: number;
  unit?: string;
  category: MetricCategory;
  period?: string;
  period_start?: string;
  period_end?: string;
  trend?: 'up' | 'down' | 'stable';
  change_percent?: number;
  created_at: string;
}

export type MetricCategory =
  | 'finance'
  | 'sales'
  | 'marketing'
  | 'team'
  | 'product'
  | 'ops'
  | 'customer'
  | 'investor'
  | 'compliance';

export interface Activity {
  id: string;
  entity_id?: string;
  action: string;
  actor?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

// ============================================
// INTEGRATIONS
// ============================================

export type IntegrationSource =
  | 'salesforce'
  | 'mulesoft'
  | 'notion'
  | 'coda'
  | 'airtable'
  | 'box'
  | 'google_drive'
  | 'zoho_books'
  | 'zoho_crm'
  | 'hubspot'
  | 'stripe'
  | 'razorpay'
  | 'slack'
  | 'manual';

export interface Integration {
  id: string;
  name: string;
  type: IntegrationSource;
  status: 'active' | 'inactive' | 'error' | 'pending_auth';
  config?: Record<string, unknown>;
  last_sync?: string;
  sync_frequency?: string;
  created_at: string;
}

export interface SyncLog {
  id: string;
  integration_id: string;
  sync_type: 'full' | 'incremental';
  status: 'started' | 'success' | 'failed';
  records_synced: number;
  errors?: string[];
  started_at: string;
  completed_at?: string;
}

// ============================================
// COMPLIANCE
// ============================================

export type ComplianceFramework = 'soc2' | 'gdpr' | 'gst' | 'roc' | 'iso27001' | 'hipaa';

export interface ComplianceItem {
  id: string;
  framework: ComplianceFramework;
  control_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'compliant' | 'non_compliant' | 'not_applicable';
  evidence_url?: string;
  owner?: string;
  due_date?: string;
  last_reviewed?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GSTFiling {
  id: string;
  filing_type: 'GSTR1' | 'GSTR3B' | 'GSTR9' | 'GSTR9C';
  period: string;
  status: 'pending' | 'filed' | 'reconciled' | 'error';
  amount: number;
  filed_date?: string;
  due_date?: string;
  portal_reference?: string;
  notes?: string;
  created_at: string;
}

export interface ROCFiling {
  id: string;
  form_type: string;
  financial_year: string;
  status: 'pending' | 'filed' | 'acknowledged';
  filed_date?: string;
  due_date?: string;
  srn_number?: string;
  notes?: string;
  created_at: string;
}

// ============================================
// FINANCE
// ============================================

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  currency: string;
  account?: string;
  description?: string;
  vendor?: string;
  invoice_number?: string;
  transaction_date: string;
  reconciled: boolean;
  source?: IntegrationSource;
  source_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  allocated: number;
  spent: number;
  period_type: 'monthly' | 'quarterly' | 'yearly';
  period_start: string;
  period_end: string;
  notes?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id?: string;
  amount: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date?: string;
  paid_date?: string;
  items?: InvoiceLineItem[];
  notes?: string;
  source?: IntegrationSource;
  source_id?: string;
  created_at: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate?: number;
}

export interface FinanceSummary {
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
}

// ============================================
// SALES & CRM
// ============================================

export interface Opportunity {
  id: string;
  name: string;
  account?: string;
  stage: OpportunityStage;
  amount: number;
  probability: number;
  close_date?: string;
  owner?: string;
  source?: IntegrationSource;
  source_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type OpportunityStage =
  | 'prospecting'
  | 'qualification'
  | 'needs_analysis'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  company?: string;
  status: 'active' | 'churned' | 'at_risk' | 'prospect';
  mrr: number;
  ltv: number;
  health_score: number;
  contract_start?: string;
  contract_end?: string;
  last_activity?: string;
  owner?: string;
  source?: IntegrationSource;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SalesMetrics {
  pipeline_value: number;
  pipeline_count: number;
  won_this_month: number;
  won_value_this_month: number;
  lost_this_month: number;
  avg_deal_size: number;
  win_rate: number;
  avg_sales_cycle_days: number;
  cac: number;
}

// ============================================
// MARKETING
// ============================================

export interface MarketingCampaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'content' | 'paid_ads' | 'event' | 'webinar';
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  start_date?: string;
  end_date?: string;
  target_audience?: string;
  channels?: string[];
  metrics?: CampaignMetrics;
  owner?: string;
  created_at: string;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  leads_generated: number;
  cost_per_lead: number;
  roi: number;
}

export interface MarketingMetrics {
  website_visitors: number;
  leads_this_month: number;
  mql_count: number;
  sql_count: number;
  conversion_rate: number;
  cac: number;
  ltv_cac_ratio: number;
  content_pieces: number;
  social_followers: number;
}

// ============================================
// TEAM & HR
// ============================================

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: string;
  department?: string;
  status: 'active' | 'on_leave' | 'offboarded';
  employment_type: 'full_time' | 'part_time' | 'contractor';
  start_date?: string;
  reporting_to?: string;
  utilization_target: number;
  utilization_actual?: number;
  hourly_rate?: number;
  skills?: string[];
  avatar_url?: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  team_member_id: string;
  entity_id?: string;
  hours: number;
  description?: string;
  billable: boolean;
  date: string;
  created_at: string;
}

export interface TeamMetrics {
  total_members: number;
  utilization_avg: number;
  billable_hours_this_month: number;
  non_billable_hours_this_month: number;
  capacity_hours: number;
  headcount_growth: number;
}

// ============================================
// OKRs
// ============================================

export interface Objective {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  category: 'company' | 'team' | 'individual';
  status: 'active' | 'completed' | 'cancelled';
  progress: number;
  start_date?: string;
  end_date?: string;
  key_results?: KeyResult[];
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: string;
  objective_id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit?: string;
  owner?: string;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// INVESTORS
// ============================================

export interface Investor {
  id: string;
  name: string;
  type: 'angel' | 'vc' | 'strategic' | 'institutional' | 'family_office';
  contact_name?: string;
  email?: string;
  phone?: string;
  firm?: string;
  status: 'prospect' | 'in_talks' | 'committed' | 'invested' | 'passed';
  invested_amount: number;
  equity_percentage: number;
  investment_date?: string;
  notes?: string;
  created_at: string;
}

export interface FundingRound {
  id: string;
  name: string;
  target_amount: number;
  raised_amount: number;
  valuation?: number;
  status: 'planning' | 'active' | 'closed' | 'cancelled';
  start_date?: string;
  close_date?: string;
  term_sheet_url?: string;
  notes?: string;
  created_at: string;
}

export interface InvestorDocument {
  id: string;
  title: string;
  type: 'pitch_deck' | 'financial_model' | 'cap_table' | 'term_sheet' | 'data_room';
  version?: string;
  file_url?: string;
  gcs_path?: string;
  status: 'draft' | 'final' | 'shared';
  shared_with?: string[];
  created_at: string;
  updated_at: string;
}

// ============================================
// COPILOT / AI
// ============================================

export interface AICommand {
  id: string;
  input: string;
  intent?: CopilotIntent;
  entities_affected?: string[];
  response?: string;
  success: boolean;
  created_at: string;
}

export interface CommandResult {
  intent: CopilotIntent;
  action?: string;
  entities?: Entity[];
  metrics?: Metric[];
  message: string;
  data?: unknown;
  suggestions?: string[];
  visualization?: VisualizationSpec;
}

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

export interface VisualizationSpec {
  type: 'chart' | 'table' | 'kpi_cards' | 'timeline';
  chart_type?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title: string;
  data: unknown;
  config?: Record<string, unknown>;
}

export interface CopilotConversation {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    intent?: CopilotIntent;
    entities_referenced?: string[];
    api_calls?: string[];
  };
  created_at: string;
}

// ============================================
// GOOGLE CLOUD TYPES
// ============================================

export interface BigQueryMetricRow {
  timestamp: string;
  metric_key: string;
  value: number;
  category: string;
  dimensions?: Record<string, string>;
}

export interface VertexAIEmbedding {
  values: number[];
  statistics?: {
    truncated: boolean;
    token_count: number;
  };
}

export interface GCSDocument {
  name: string;
  bucket: string;
  content_type: string;
  size: number;
  created: string;
  updated: string;
  metadata?: Record<string, string>;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface DashboardSummary {
  finance: FinanceSummary;
  sales: SalesMetrics;
  marketing: MarketingMetrics;
  team: TeamMetrics;
  compliance: {
    total_controls: number;
    compliant: number;
    pending: number;
    at_risk: number;
  };
  recent_activities: Activity[];
  upcoming_deadlines: Entity[];
}

export interface MetricTrend {
  key: string;
  current: number;
  previous: number;
  change: number;
  change_percent: number;
  trend: 'up' | 'down' | 'stable';
  series: { date: string; value: number }[];
}
