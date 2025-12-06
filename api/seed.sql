-- Seed data for Hub Controller

-- Sample Projects
INSERT INTO entities (id, type, title, description, status, priority, category, owner, created_at, updated_at) VALUES
('proj-001', 'project', 'IntegrateWise Platform', 'Main SaaS platform development', 'active', 'high', 'SaaS', 'nirmal', datetime('now'), datetime('now')),
('proj-002', 'project', 'Hub Controller', 'Unified controller hub for business ops', 'active', 'high', 'SaaS', 'nirmal', datetime('now'), datetime('now')),
('proj-003', 'project', 'Client Onboarding Portal', 'Self-serve onboarding for enterprise clients', 'active', 'medium', 'Services', 'nirmal', datetime('now'), datetime('now')),
('proj-004', 'project', 'AI Agent Framework', 'Internal AI automation framework', 'active', 'high', 'Startup', 'nirmal', datetime('now'), datetime('now'));

-- Sample Customers
INSERT INTO entities (id, type, title, description, status, priority, category, metadata, created_at, updated_at) VALUES
('cust-001', 'customer', 'Acme Corp', 'Enterprise client - manufacturing', 'active', 'high', 'Enterprise', '{"mrr": 15000, "healthScore": 85}', datetime('now'), datetime('now')),
('cust-002', 'customer', 'TechStart Inc', 'Startup client - SaaS', 'active', 'medium', 'Startup', '{"mrr": 2500, "healthScore": 92}', datetime('now'), datetime('now')),
('cust-003', 'customer', 'Global Services Ltd', 'Mid-market client - consulting', 'active', 'medium', 'Mid-Market', '{"mrr": 8000, "healthScore": 78}', datetime('now'), datetime('now'));

-- Sample Opportunities
INSERT INTO entities (id, type, title, status, priority, category, metadata, due_date, source, created_at, updated_at) VALUES
('opp-001', 'opportunity', 'Acme Corp - Enterprise Upgrade', 'active', 'high', 'Upsell', '{"amount": 50000, "account": "Acme Corp"}', '2025-01-15', 'salesforce', datetime('now'), datetime('now')),
('opp-002', 'opportunity', 'NewCo - Platform Demo', 'active', 'medium', 'New Business', '{"amount": 25000, "account": "NewCo Industries"}', '2025-01-30', 'salesforce', datetime('now'), datetime('now'));

-- Sample Tasks
INSERT INTO entities (id, type, title, status, priority, category, parent_id, due_date, created_at, updated_at) VALUES
('task-001', 'task', 'Complete API documentation', 'active', 'high', 'Development', 'proj-002', '2024-12-15', datetime('now'), datetime('now')),
('task-002', 'task', 'Review Q4 financials', 'pending', 'medium', 'Finance', NULL, '2024-12-20', datetime('now'), datetime('now')),
('task-003', 'task', 'Prepare investor update', 'pending', 'high', 'Investors', NULL, '2024-12-31', datetime('now'), datetime('now'));

-- Sample Team Members
INSERT INTO entities (id, type, title, status, category, metadata, created_at, updated_at) VALUES
('team-001', 'team_member', 'Nirmal Prince', 'active', 'Founder', '{"utilization": 95, "role": "CEO"}', datetime('now'), datetime('now')),
('team-002', 'team_member', 'Alex Dev', 'active', 'Engineering', '{"utilization": 85, "role": "Lead Engineer"}', datetime('now'), datetime('now')),
('team-003', 'team_member', 'Sarah Sales', 'active', 'Sales', '{"utilization": 80, "role": "Sales Lead"}', datetime('now'), datetime('now'));

-- Sample Documents
INSERT INTO entities (id, type, title, status, category, metadata, source, created_at, updated_at) VALUES
('doc-001', 'document', 'Product Roadmap 2025', 'active', 'Planning', '{"url": "https://notion.so/roadmap", "type": "Roadmap"}', 'notion', datetime('now'), datetime('now')),
('doc-002', 'document', 'Q4 Board Deck', 'completed', 'investor', '{"url": "https://drive.google.com/board", "type": "Board"}', 'drive', datetime('now'), datetime('now')),
('doc-003', 'document', 'SOC 2 Compliance Guide', 'active', 'system', '{"url": "https://coda.io/soc2", "type": "Compliance"}', 'coda', datetime('now'), datetime('now'));

-- Sample Compliance Items
INSERT INTO entities (id, type, title, status, priority, owner, due_date, created_at, updated_at) VALUES
('comp-001', 'compliance', 'SOC 2 Type II Audit', 'completed', 'high', 'Security Team', '2024-12-31', datetime('now'), datetime('now')),
('comp-002', 'compliance', 'GDPR Annual Review', 'completed', 'high', 'Legal', '2024-12-31', datetime('now'), datetime('now')),
('comp-003', 'compliance', 'Security Training Q1', 'pending', 'medium', 'HR', '2025-01-15', datetime('now'), datetime('now'));

-- Sample R&D Projects
INSERT INTO entities (id, type, title, status, category, metadata, created_at, updated_at) VALUES
('rnd-001', 'rnd', 'AI Agent Framework', 'active', 'AI/ML', '{"progress": 75}', datetime('now'), datetime('now')),
('rnd-002', 'rnd', 'Data Pipeline Optimization', 'active', 'Infrastructure', '{"progress": 60}', datetime('now'), datetime('now')),
('rnd-003', 'rnd', 'Zero-Trust Security Model', 'pending', 'Security', '{"progress": 20}', datetime('now'), datetime('now'));

-- Sample Metrics
INSERT INTO metrics (id, key, value, unit, category, period, created_at) VALUES
('met-001', 'mrr', 120000, 'USD', 'finance', 'monthly', datetime('now')),
('met-002', 'burn', 80000, 'USD', 'finance', 'monthly', datetime('now')),
('met-003', 'runway', 9, 'months', 'finance', 'monthly', datetime('now')),
('met-004', 'budget', 1000000, 'USD', 'finance', 'annual', datetime('now')),
('met-005', 'actual', 800000, 'USD', 'finance', 'annual', datetime('now')),
('met-006', 'leads', 1250, 'count', 'marketing', 'monthly', datetime('now')),
('met-007', 'mqls', 320, 'count', 'marketing', 'monthly', datetime('now')),
('met-008', 'cac', 450, 'USD', 'marketing', 'monthly', datetime('now')),
('met-009', 'roi', 3.2, 'ratio', 'marketing', 'monthly', datetime('now')),
('met-010', 'utilization', 72, 'percent', 'team', 'monthly', datetime('now'));

-- Sample Activities
INSERT INTO activities (id, entity_id, action, actor, details, created_at) VALUES
('act-001', 'proj-002', 'created', 'nirmal', '{"via": "manual"}', datetime('now')),
('act-002', 'cust-001', 'updated', 'system', '{"field": "healthScore", "from": 80, "to": 85}', datetime('now')),
('act-003', 'opp-001', 'stage_changed', 'sarah', '{"from": "Proposal", "to": "Negotiation"}', datetime('now'));

-- Sample Integrations
INSERT INTO integrations (id, name, type, status, last_sync, created_at) VALUES
('int-001', 'Salesforce', 'crm', 'active', datetime('now'), datetime('now')),
('int-002', 'Notion', 'docs', 'active', datetime('now'), datetime('now')),
('int-003', 'Coda', 'docs', 'active', datetime('now'), datetime('now')),
('int-004', 'Airtable', 'database', 'expired', datetime('now', '-5 days'), datetime('now'));
