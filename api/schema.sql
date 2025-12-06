-- Hub Controller Database Schema
-- Single source of truth for IntegrateWise

-- Core entities table - unified storage for all items
CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- project, task, customer, opportunity, document, note, metric, event
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  category TEXT,
  tags TEXT, -- JSON array of tags
  metadata TEXT, -- JSON object for type-specific fields
  parent_id TEXT,
  owner TEXT,
  source TEXT, -- salesforce, notion, manual, etc.
  source_id TEXT, -- external system ID
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES entities(id)
);

-- Metrics/KPIs table
CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  category TEXT NOT NULL, -- finance, sales, marketing, team, etc.
  period TEXT, -- daily, weekly, monthly
  period_start TEXT,
  period_end TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Activities/Events log
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  entity_id TEXT,
  action TEXT NOT NULL, -- created, updated, completed, commented, etc.
  actor TEXT,
  details TEXT, -- JSON object
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (entity_id) REFERENCES entities(id)
);

-- Integrations config
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- salesforce, notion, coda, airtable, etc.
  config TEXT, -- JSON encrypted config
  status TEXT DEFAULT 'active',
  last_sync TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- AI conversations/commands history
CREATE TABLE IF NOT EXISTS ai_commands (
  id TEXT PRIMARY KEY,
  input TEXT NOT NULL,
  intent TEXT,
  entities_affected TEXT, -- JSON array of entity IDs
  response TEXT,
  success INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
CREATE INDEX IF NOT EXISTS idx_entities_category ON entities(category);
CREATE INDEX IF NOT EXISTS idx_entities_owner ON entities(owner);
CREATE INDEX IF NOT EXISTS idx_entities_due_date ON entities(due_date);
CREATE INDEX IF NOT EXISTS idx_entities_source ON entities(source);
CREATE INDEX IF NOT EXISTS idx_metrics_category ON metrics(category);
CREATE INDEX IF NOT EXISTS idx_metrics_key ON metrics(key);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at);

-- Full-text search on entities
CREATE VIRTUAL TABLE IF NOT EXISTS entities_fts USING fts5(
  id,
  title,
  description,
  tags,
  content='entities',
  content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS entities_ai AFTER INSERT ON entities BEGIN
  INSERT INTO entities_fts(id, title, description, tags)
  VALUES (new.id, new.title, new.description, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS entities_ad AFTER DELETE ON entities BEGIN
  DELETE FROM entities_fts WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS entities_au AFTER UPDATE ON entities BEGIN
  DELETE FROM entities_fts WHERE id = old.id;
  INSERT INTO entities_fts(id, title, description, tags)
  VALUES (new.id, new.title, new.description, new.tags);
END;
