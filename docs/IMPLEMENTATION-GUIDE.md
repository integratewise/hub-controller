# IntegrateWise Hub Infrastructure Bridge Plan

## Overview

This document outlines the operational hardening plan to bridge the IntegrateWise Hub infrastructure stack. It consolidates three critical bridge points:

1. **Spine API Contracts** - Confirm and publish API specifications
2. **Neon Driver Hardening** - Lock database driver configuration
3. **Notebook-to-Source Linkage** - Connect Hub notebooks to canonical sources

**Status:** In Progress  
**Last Updated:** 2025-12-06  
**Owner:** Platform Team

---

## Bridge Point 1: Spine API Contracts ✓ IN PROGRESS

### Current State
- Hub controller routes exist in `/api/src/routes.ts` (804 lines)
- Routes organized by domain: finance, compliance, sales, marketing, team, investor, okr, dashboard, integration
- Each route group exposes GET/POST endpoints with Hono framework
- Database integration uses `db.ts` with Neon serverless driver

### Completed
- ✅ **SPINE-API.md Published** - Comprehensive API contract at `/docs/SPINE-API.md`
  - Auth/session endpoints with JWT tokens
  - Notebooks CRUD (GET, POST)
  - Documents CRUD with metadata (source_of_truth, box_file_id)
  - Secrets catalog endpoints with rotation metadata
  - Webhooks subscription and event handling
  - Error handling with standard response format
  - Rate limiting (1000 req/min per API key)

### Remaining Tasks

#### 1. Publish OpenAPI to Vercel
- **Task:** Generate OpenAPI 3.0 spec from SPINE-API.md
- **Action:** Create `/public/docs/openapi.yaml` in hub-controller repo
- **Reference:** [Vercel Static Export](https://vercel.com/docs/concepts/static-export)
- **Acceptance:** Spec builds on deploy, accessible at `/docs/openapi.yaml`
- **Priority:** HIGH

#### 2. Add OpenAPI Generation Script
- **Task:** Create build step to convert Markdown spec to OpenAPI YAML
- **File:** `scripts/generate-openapi.js`
- **Tool Options:** 
  - [apidom](https://github.com/swagger-api/apidom) (parse Markdown refs)
  - [swagger-cli](https://github.com/APIDevTools/swagger-cli) (validate YAML)
- **Vercel Build Hook:** Add to `package.json` build script
- **Acceptance:** `npm run build` generates valid OpenAPI spec
- **Priority:** HIGH

#### 3. Add Swagger UI Route (Optional)
- **Task:** Expose interactive API docs at `/api-docs`
- **Library:** [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express) or [ReDoc](https://redoc.ly/)
- **Route:** Add to hub-controller frontend
- **Acceptance:** Clickable endpoint examples work in browser
- **Priority:** MEDIUM

---

## Bridge Point 2: Neon Driver Hardening ⏳ PENDING

### Current State
- Neon serverless driver used in `integratewise-hub/src/lib/db.ts`
- `neon()` function wraps connection string from `process.env.DATABASE_URL`
- All queries use Neon HTTP API (no WebSocket yet)
- No explicit connection pooling or transaction handling

### Required Changes

#### 1. Split HTTP/WS Driver Usage
- **File:** `src/lib/db.ts` (integratewise-hub)
- **Change:** Use `neon/http` for reads, `neon/ws` for transactions
  ```typescript
  // For simple reads
  import { neon } from '@neondatabase/serverless';
  const sql = neon(process.env.DATABASE_URL);
  
  // For transactions
  import { neon } from '@neondatabase/serverless/ws';
  const sqlWs = neon(process.env.DATABASE_URL, { ws: true });
  ```
- **Acceptance:** Read tests use HTTP, transaction tests use WS with rollback
- **Priority:** HIGH

#### 2. Lock Credentials in Bitwarden
- **Collection:** Create `IntegrateWise-Platform` in Bitwarden
- **Item Name:** `NEON_DATABASE_URL`
- **Fields:**
  ```json
  {
    "name": "NEON_DATABASE_URL",
    "scope": "env",
    "owner": "platform",
    "ttl_days": 90,
    "rotation_url": "https://console.neon.tech/app/projects/restless-lab-16747602",
    "last_rotated_at": "2025-12-06",
    "status": "active"
  }
  ```
- **Acceptance:** Vercel env-sync pulls from Bitwarden
- **Priority:** HIGH

#### 3. Inject into Vercel Environment
- **Vercel Project:** `integratewise-hub`
- **Settings:** Project → Settings → Environment Variables
- **Variable:** `DATABASE_URL` = Bitwarden secret
- **Scope:** Production, Preview, Development
- **Method:** Manual paste OR Bitwarden integration via GitHub Actions
- **Action Workflow:** Auto-sync when secret rotates
- **Acceptance:** Build succeeds, database queries work
- **Priority:** HIGH

#### 4. Add Connection Pooling (Optional)
- **Library:** [pg-boss](https://www.npmjs.com/package/pg-boss) or native pooling
- **Config:** Max 10 connections, idle timeout 30s
- **Metrics:** Add Vercel Analytics for connection pool size
- **Acceptance:** No connection errors under load
- **Priority:** MEDIUM

---

## Bridge Point 3: Notebook Source Linkage ⏳ PENDING

### Current State
- Hub notebooks exist (15 total: Finance, Digital Presence & IT, Security, etc.)
- Documents have `metadata` field but not linked to canonical sources
- Box Security folder contains source-of-truth documents (353733918443)

### Required Changes

#### 1. Extend Document Metadata Schema
- **File:** `integratewise-hub/src/lib/db.ts` - Update `Document` interface
  ```typescript
  export interface Document {
    id: string;
    notebook_id: string;
    title: string;
    content: string | null;
    order_index: number;
    created_at: Date;
    updated_at: Date;
    // NEW FIELDS:
    source_of_truth?: string; // "box://folder/file.md" or "github://repo/path"
    source_file_id?: string;  // Box file ID: "12345"
    last_synced_at?: Date;    // When content last pulled from source
    sync_status?: 'synced' | 'pending' | 'error';
  }
  ```
- **Migration:** Add columns to `documents` table
- **Acceptance:** Schema validation passes, nullable fields work
- **Priority:** HIGH

#### 2. Map Box Security Docs to Notebooks
- **Security Notebook Contents** (to add):
  1. Architecture Overview → `/Box/Security/Security_Architecture_v1.md`
  2. Compliance Framework → `/Box/Security/Compliance_Framework.pdf`
  3. Audit Checklist → `/Box/Security/Audit_Checklist_v2.xlsx`
  4. Incident Response → `/Box/Security/Incident_Response_Plan.md`
  5. Data Classification → `/Box/Security/Data_Classification.md`

- **Digital Presence & IT Notebook** (to add):
  1. Domain Setup → `/Box/Operations/Domain_Setup_Checklist.md`
  2. DNS Records → `/Box/Operations/DNS_Configuration.md`
  3. Email Configuration → `/Box/Operations/Email_Setup.md`
  4. SSL Certificates → `/Box/Operations/SSL_Certificate_Management.md`

- **Finance Notebook** (to add):
  1. Budget Template → `/Box/Finance/Budget_FY2026.xlsx`
  2. Invoice Template → `/Box/Finance/Invoice_Template.docx`
  3. Expense Policy → `/Box/Finance/Expense_Policy.md`

- **Mapping Task:** For each doc, create Hub entry with:
  ```json
  {
    "title": "Security Architecture",
    "content": "[Summary extracted from Box]",
    "notebook_id": "nb_security",
    "source_of_truth": "box://353733918443/Security_Architecture_v1.md",
    "source_file_id": "[Box file ID]",
    "last_synced_at": "2025-12-06T10:00:00Z"
  }
  ```
- **Acceptance:** Each notebook shows ≥3 linked docs, sync timestamp visible
- **Priority:** HIGH

#### 3. Build Box Sync Job (Optional)
- **Service:** Vercel Cron Function or GitHub Actions
- **Schedule:** Daily at 2 AM UTC
- **Action:** 
  1. Query Box Security folder
  2. For each document, check if Hub entry exists
  3. If missing, create with `sync_status: 'pending'`
  4. If exists, update `last_synced_at`
- **Config File:** `.github/workflows/box-sync.yml`
- **Acceptance:** Cron runs, logs show successful syncs
- **Priority:** MEDIUM

---

## Operational Runbooks (Supporting)

### Spine Deploy Runbook
- **Trigger:** New API endpoint added to routes.ts
- **Steps:**
  1. Update SPINE-API.md with endpoint spec
  2. Run `npm run generate-openapi` (validates schema)
  3. Commit with PR, get review
  4. Merge to main, Vercel auto-deploys
  5. Verify at `hub-controller.vercel.app/api-docs`
- **Rollback:** Revert commit, Vercel redeploys
- **Owner:** Platform Team
- **SLA:** Deploy within 1 business day

### Secrets Rotation Runbook
- **Trigger:** Monthly rotation schedule (TTL:90d)
- **Steps:**
  1. Generate new `NEON_DATABASE_URL` (Neon console)
  2. Update Bitwarden item with new value + timestamp
  3. Run GitHub Actions sync (updates Vercel env)
  4. Test Hub at integratewise-hub.vercel.app
  5. Verify no connection errors in logs
- **Owner:** Platform Team
- **SLA:** Rotation within 4 hours

### Notebook Sync Runbook
- **Trigger:** New docs added to Box Security folder
- **Steps:**
  1. Get Box file ID (right-click → Share → Copy URL)
  2. Create Hub document entry with `source_file_id`
  3. Set `last_synced_at` to current time
  4. Test link in Hub notebook
- **Owner:** Operations Team
- **SLA:** Sync within 1 business day

---

## Success Criteria

### API Contracts
- [ ] OpenAPI spec publishes to Vercel
- [ ] Swagger UI accessible at `/api-docs`
- [ ] All endpoints documented with examples

### Neon Driver
- [ ] DATABASE_URL stored in Bitwarden
- [ ] Vercel pulls from Bitwarden on build
- [ ] WebSocket used for transactions (rollback tests pass)
- [ ] Zero connection errors under normal load

### Notebook Linkage
- [ ] Security, Finance, Digital Presence notebooks have ≥3 docs each
- [ ] Each doc shows `source_of_truth` and `last_synced_at`
- [ ] Box Sync job runs daily (logs visible)
- [ ] All links clickable and reference real sources

---

## Timeline

| Phase | Task | Owner | Due | Status |
|-------|------|-------|-----|--------|
| 1 | Publish OpenAPI to Vercel | Platform | 2025-12-10 | Pending |
| 1 | Add Swagger UI | Platform | 2025-12-12 | Pending |
| 2 | Lock Neon in Bitwarden | Platform | 2025-12-10 | Pending |
| 2 | Inject into Vercel env | Platform | 2025-12-11 | Pending |
| 3 | Map Box docs to notebooks | Ops | 2025-12-15 | Pending |
| 3 | Add Box sync job | Platform | 2025-12-17 | Pending |
| - | All runbooks documented | Ops | 2025-12-20 | Pending |

---

## References

- **Spine API Contract:** [docs/SPINE-API.md](./SPINE-API.md)
- **Hub Controller:** [GitHub: integratewise/hub-controller](https://github.com/integratewise/hub-controller)
- **Integratewise Hub:** [GitHub: integratewise/integratewise-hub](https://github.com/integratewise/integratewise-hub)
- **Neon Console:** [console.neon.tech](https://console.neon.tech/app/projects/restless-lab-16747602)
- **Bitwarden:** [bitwarden.com](https://bitwarden.com/)
- **Vercel Project:** [integratewise-hub](https://vercel.com/integratewises-projects/integratewise-hub)

---

## Next Steps

1. **Immediate:** Verify Neon connection in integratewise-hub
2. **This Week:** Publish OpenAPI spec to Vercel
3. **Next Week:** Lock NEON_DATABASE_URL in Bitwarden
4. **Following Week:** Map Box Security docs to Security notebook
5. **Month End:** Complete all runbooks and document SLAs

**Contact:** [connect@integratewise.co](mailto:connect@integratewise.co)
