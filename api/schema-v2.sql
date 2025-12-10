-- Hub Controller v2 Database Schema
-- Multi-tenant architecture for SaaS deployment
-- Supports: Auth, Organizations, Row-level tenant isolation

-- ============================================
-- MULTI-TENANCY CORE
-- ============================================

-- Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  logo_url TEXT,
  plan TEXT DEFAULT 'free', -- free, starter, pro, enterprise
  billing_email TEXT,
  settings TEXT, -- JSON: branding, features, limits
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Users (Global across organizations)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  password_hash TEXT,
  email_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Organization Memberships
CREATE TABLE IF NOT EXISTS org_members (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  status TEXT DEFAULT 'active', -- active, invited, suspended
  invited_by TEXT,
  invited_at TEXT,
  joined_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(org_id, user_id)
);

-- Sessions (for auth)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  org_id TEXT,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- API Keys (per org)
CREATE TABLE IF NOT EXISTS org_api_keys (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes TEXT, -- JSON array: ["read", "write", "admin"]
  last_used_at TEXT,
  expires_at TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- TASKS & PROJECTS (New)
-- ============================================

-- Task Boards
CREATE TABLE IF NOT EXISTS task_boards (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'kanban', -- kanban, list, timeline
  columns TEXT DEFAULT '["todo","in_progress","review","done"]', -- JSON array
  settings TEXT, -- JSON: WIP limits, automation rules
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Task Comments
CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  mentions TEXT, -- JSON array of user_ids
  attachments TEXT, -- JSON array of file URLs
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- CRM (New)
-- ============================================

-- Contacts (people)
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company_id TEXT,
  title TEXT,
  linkedin_url TEXT,
  source TEXT, -- website, referral, linkedin, etc.
  lifecycle_stage TEXT DEFAULT 'lead', -- lead, mql, sql, opportunity, customer
  owner_id TEXT,
  tags TEXT, -- JSON array
  custom_fields TEXT, -- JSON object
  last_contacted_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES entities(id),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Contact Activities (emails, calls, meetings, notes)
CREATE TABLE IF NOT EXISTS contact_activities (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  contact_id TEXT,
  company_id TEXT,
  deal_id TEXT,
  type TEXT NOT NULL, -- email, call, meeting, note, task
  subject TEXT,
  content TEXT,
  direction TEXT, -- inbound, outbound
  outcome TEXT, -- for calls: answered, voicemail, no_answer
  duration_minutes INTEGER,
  logged_by TEXT,
  activity_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (company_id) REFERENCES entities(id),
  FOREIGN KEY (logged_by) REFERENCES users(id)
);

-- Deals Pipeline
CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  company_id TEXT,
  contact_id TEXT,
  amount REAL,
  currency TEXT DEFAULT 'USD',
  stage TEXT NOT NULL, -- prospecting, qualified, proposal, negotiation, closed_won, closed_lost
  probability INTEGER DEFAULT 0,
  expected_close_date TEXT,
  actual_close_date TEXT,
  owner_id TEXT,
  source TEXT,
  lost_reason TEXT,
  notes TEXT,
  custom_fields TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES entities(id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- ============================================
-- MEETINGS (New)
-- ============================================

-- Meeting Types (booking pages)
CREATE TABLE IF NOT EXISTS meeting_types (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  host_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  location_type TEXT DEFAULT 'google_meet', -- google_meet, zoom, phone, in_person, custom
  location_details TEXT,
  color TEXT DEFAULT '#6366f1',
  availability TEXT, -- JSON: { "mon": ["09:00-12:00", "13:00-17:00"], ... }
  buffer_before INTEGER DEFAULT 0,
  buffer_after INTEGER DEFAULT 0,
  booking_window_days INTEGER DEFAULT 30,
  max_bookings_per_day INTEGER,
  questions TEXT, -- JSON array of form fields
  confirmation_message TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (host_id) REFERENCES users(id),
  UNIQUE(org_id, slug)
);

-- Scheduled Meetings
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  meeting_type_id TEXT NOT NULL,
  host_id TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_name TEXT,
  guest_notes TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled', -- scheduled, cancelled, completed, no_show
  location TEXT,
  meeting_url TEXT,
  calendar_event_id TEXT,
  responses TEXT, -- JSON: answers to questions
  cancelled_at TEXT,
  cancelled_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (meeting_type_id) REFERENCES meeting_types(id),
  FOREIGN KEY (host_id) REFERENCES users(id)
);

-- Calendar Connections
CREATE TABLE IF NOT EXISTS calendar_connections (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- google, outlook
  account_email TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TEXT,
  calendar_id TEXT,
  is_primary INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- DOCUMENTS (New)
-- ============================================

-- Document Blocks (for block-based editing like Notion)
CREATE TABLE IF NOT EXISTS document_blocks (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  parent_block_id TEXT,
  type TEXT NOT NULL, -- paragraph, heading, list, image, code, table, etc.
  content TEXT, -- JSON content based on type
  position INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_block_id) REFERENCES document_blocks(id)
);

-- Document Shares
CREATE TABLE IF NOT EXISTS document_shares (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  share_type TEXT NOT NULL, -- user, public, org
  user_id TEXT,
  permission TEXT DEFAULT 'view', -- view, comment, edit
  public_token TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- INDEXES FOR NEW TABLES
-- ============================================

-- Auth indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_org_api_keys_org ON org_api_keys(org_id);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_task_boards_org ON task_boards(org_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_org ON task_comments(org_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);

-- CRM indexes
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_activities_org ON contact_activities(org_id);
CREATE INDEX IF NOT EXISTS idx_contact_activities_contact ON contact_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_org ON deals(org_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(company_id);

-- Meetings indexes
CREATE INDEX IF NOT EXISTS idx_meeting_types_org ON meeting_types(org_id);
CREATE INDEX IF NOT EXISTS idx_meeting_types_host ON meeting_types(host_id);
CREATE INDEX IF NOT EXISTS idx_meetings_org ON meetings(org_id);
CREATE INDEX IF NOT EXISTS idx_meetings_host ON meetings(host_id);
CREATE INDEX IF NOT EXISTS idx_meetings_type ON meetings(meeting_type_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user ON calendar_connections(user_id);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_document_blocks_org ON document_blocks(org_id);
CREATE INDEX IF NOT EXISTS idx_document_blocks_doc ON document_blocks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_org ON document_shares(org_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_doc ON document_shares(document_id);

-- ============================================
-- MIGRATION: Add org_id to existing tables
-- Run these ALTER statements separately if tables exist
-- ============================================

-- ALTER TABLE entities ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE metrics ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE activities ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE integrations ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE ai_commands ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE compliance_items ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE gst_filings ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE roc_filings ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE audit_logs ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE transactions ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE budgets ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE invoices ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE objectives ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE key_results ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE investors ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE funding_rounds ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE investor_documents ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE team_members ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE time_entries ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE copilot_cache ADD COLUMN org_id TEXT REFERENCES organizations(id);
-- ALTER TABLE copilot_conversations ADD COLUMN org_id TEXT REFERENCES organizations(id);

-- Create indexes for org_id on existing tables after migration
-- CREATE INDEX IF NOT EXISTS idx_entities_org ON entities(org_id);
-- CREATE INDEX IF NOT EXISTS idx_metrics_org ON metrics(org_id);
-- CREATE INDEX IF NOT EXISTS idx_activities_org ON activities(org_id);
-- etc.
