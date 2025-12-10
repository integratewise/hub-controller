-- Hub Controller Extended Database Schema
-- Comprehensive schema for Universal Controller Hub
-- Supports: Startup Launch, SaaS, Services, Sales, Marketing, Finance, Ops, Team, Digital, R&D, Investors

-- ============================================
-- COMPLIANCE & GOVERNANCE
-- ============================================

-- Compliance items (SOC2, GDPR, GST, ROC)
CREATE TABLE IF NOT EXISTS compliance_items (
  id TEXT PRIMARY KEY,
  framework TEXT NOT NULL, -- soc2, gdpr, gst, roc, iso27001
  control_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, compliant, non_compliant, not_applicable
  evidence_url TEXT,
  owner TEXT,
  due_date TEXT,
  last_reviewed TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- GST Filings
CREATE TABLE IF NOT EXISTS gst_filings (
  id TEXT PRIMARY KEY,
  filing_type TEXT NOT NULL, -- GSTR1, GSTR3B, GSTR9, etc.
  period TEXT NOT NULL, -- e.g., "2025-11" for November 2025
  status TEXT DEFAULT 'pending', -- pending, filed, reconciled, error
  amount REAL DEFAULT 0,
  filed_date TEXT,
  due_date TEXT,
  portal_reference TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ROC Filings
CREATE TABLE IF NOT EXISTS roc_filings (
  id TEXT PRIMARY KEY,
  form_type TEXT NOT NULL, -- AOC-4, MGT-7, DIR-3 KYC, etc.
  financial_year TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  filed_date TEXT,
  due_date TEXT,
  srn_number TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  user_id TEXT,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  old_value TEXT, -- JSON
  new_value TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- FINANCIAL MANAGEMENT
-- ============================================

-- Financial transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- income, expense, transfer
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  account TEXT,
  description TEXT,
  vendor TEXT,
  invoice_number TEXT,
  transaction_date TEXT NOT NULL,
  reconciled INTEGER DEFAULT 0,
  source TEXT, -- zoho, manual, bank_import
  source_id TEXT,
  metadata TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  allocated REAL NOT NULL,
  spent REAL DEFAULT 0,
  period_type TEXT NOT NULL, -- monthly, quarterly, yearly
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  amount REAL NOT NULL,
  tax REAL DEFAULT 0,
  total REAL NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  issue_date TEXT NOT NULL,
  due_date TEXT,
  paid_date TEXT,
  items TEXT, -- JSON array of line items
  notes TEXT,
  source TEXT,
  source_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- INTEGRATIONS & SYNC
-- ============================================

-- Sync logs for integrations
CREATE TABLE IF NOT EXISTS sync_logs (
  id TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL,
  sync_type TEXT NOT NULL, -- full, incremental
  status TEXT NOT NULL, -- started, success, failed
  records_synced INTEGER DEFAULT 0,
  errors TEXT, -- JSON array
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (integration_id) REFERENCES integrations(id)
);

-- API tokens for integrations
CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL,
  token_type TEXT NOT NULL, -- access, refresh, api_key
  encrypted_token TEXT NOT NULL,
  expires_at TEXT,
  scopes TEXT, -- JSON array
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (integration_id) REFERENCES integrations(id)
);

-- ============================================
-- OKRs & GOALS
-- ============================================

-- Objectives
CREATE TABLE IF NOT EXISTS objectives (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  category TEXT, -- company, team, individual
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  progress REAL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  parent_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Key Results
CREATE TABLE IF NOT EXISTS key_results (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value REAL NOT NULL,
  current_value REAL DEFAULT 0,
  unit TEXT,
  owner TEXT,
  status TEXT DEFAULT 'on_track', -- on_track, at_risk, behind, completed
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (objective_id) REFERENCES objectives(id)
);

-- ============================================
-- INVESTOR RELATIONS
-- ============================================

-- Investors
CREATE TABLE IF NOT EXISTS investors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- angel, vc, strategic, institutional
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  firm TEXT,
  status TEXT DEFAULT 'prospect', -- prospect, active, churned
  invested_amount REAL DEFAULT 0,
  equity_percentage REAL DEFAULT 0,
  investment_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Funding Rounds
CREATE TABLE IF NOT EXISTS funding_rounds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, -- Seed, Series A, etc.
  target_amount REAL NOT NULL,
  raised_amount REAL DEFAULT 0,
  valuation REAL,
  status TEXT DEFAULT 'planning', -- planning, active, closed
  start_date TEXT,
  close_date TEXT,
  term_sheet_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Pitch Decks & Documents
CREATE TABLE IF NOT EXISTS investor_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- pitch_deck, financial_model, cap_table, term_sheet
  version TEXT,
  file_url TEXT,
  gcs_path TEXT,
  status TEXT DEFAULT 'draft',
  shared_with TEXT, -- JSON array of investor IDs
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- TEAM & HR
-- ============================================

-- Team members extended
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL,
  department TEXT,
  status TEXT DEFAULT 'active', -- active, on_leave, offboarded
  employment_type TEXT DEFAULT 'full_time', -- full_time, part_time, contractor
  start_date TEXT,
  reporting_to TEXT,
  utilization_target REAL DEFAULT 80,
  hourly_rate REAL,
  skills TEXT, -- JSON array
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Time entries for utilization
CREATE TABLE IF NOT EXISTS time_entries (
  id TEXT PRIMARY KEY,
  team_member_id TEXT NOT NULL,
  entity_id TEXT, -- project or task
  hours REAL NOT NULL,
  description TEXT,
  billable INTEGER DEFAULT 1,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_member_id) REFERENCES team_members(id),
  FOREIGN KEY (entity_id) REFERENCES entities(id)
);

-- ============================================
-- COPILOT & AI
-- ============================================

-- Copilot command cache (for Firestore-like local caching)
CREATE TABLE IF NOT EXISTS copilot_cache (
  id TEXT PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL, -- JSON
  ttl INTEGER DEFAULT 3600,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);

-- Copilot conversations
CREATE TABLE IF NOT EXISTS copilot_conversations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  metadata TEXT, -- JSON: intent, entities, etc.
  created_at TEXT DEFAULT (datetime('now'))
);

-- Semantic embeddings for docs
CREATE TABLE IF NOT EXISTS document_embeddings (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  chunk_index INTEGER DEFAULT 0,
  content TEXT NOT NULL,
  embedding TEXT, -- JSON array of floats
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (entity_id) REFERENCES entities(id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_compliance_framework ON compliance_items(framework);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_items(status);
CREATE INDEX IF NOT EXISTS idx_gst_period ON gst_filings(period);
CREATE INDEX IF NOT EXISTS idx_roc_fy ON roc_filings(financial_year);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration ON sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_objectives_status ON objectives(status);
CREATE INDEX IF NOT EXISTS idx_key_results_objective ON key_results(objective_id);
CREATE INDEX IF NOT EXISTS idx_investors_status ON investors(status);
CREATE INDEX IF NOT EXISTS idx_team_members_department ON team_members(department);
CREATE INDEX IF NOT EXISTS idx_time_entries_member ON time_entries(team_member_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_copilot_cache_key ON copilot_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_copilot_conversations_session ON copilot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
