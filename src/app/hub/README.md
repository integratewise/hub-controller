# IntegrateWise Hub

A complete, production-ready Next.js (App Router) frontend for the Universal Controller Hub.

## Features

- **Copilot Command Bar**: Natural language commands to interact with your data
- **Modular Dashboards**: Category-specific dashboards for all business functions
- **REST API Integration**: Ready-to-connect API client for backend services
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **Dark Theme**: Optimized dark mode interface

## Structure

```
src/app/hub/
├── layout.tsx              # Hub shell with Sidebar and Topbar
├── page.tsx                # Home dashboard
├── dashboard/              # Metrics & Executive Dashboard
├── projects/               # Startup Launch, SaaS, Services
├── sales/                   # Pipeline & CRM Ops
├── marketing/              # Marketing metrics
├── customers/              # Customer health & engagement
├── finance/                # Budget, burn rate, financial planning
├── ops/                    # Operations & Compliance
├── team/                   # Team utilization & culture
├── digital/                # Digital Presence & IT
├── rnd/                    # Innovation & R&D
├── investors/              # Investor Relations
├── docs/                   # Docs indexer (Drive/Box/Notion/Coda)
└── settings/               # Tokens, roles, tenants
```

## Getting Started

### 1. Environment Setup

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8080/api
```

### 2. Run Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000/hub`

### 3. Connect to Backend

The hub expects a REST API at the `NEXT_PUBLIC_API_BASE` URL. Ensure your backend implements:

- `GET /api/metrics/kpis?period={week|month}`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/integrations/salesforce/opportunities`
- `GET /api/integrations/index/docs`
- And other endpoints as needed

## Command Bar

The Copilot command bar supports natural language commands:

- "Show weekly MRR vs burn"
- "Create SaaS project: Project Name"
- "Pull latest opportunities"
- "Index docs"
- "Show customers"
- "Finance summary"

Extend commands in `src/lib/hub/cmd.ts`

## Components

### Core Components

- `Sidebar`: Navigation sidebar
- `Topbar`: Top bar with command bar
- `CommandBar`: Copilot command interface
- `KpiCard`: KPI display card
- `Chart`: Chart placeholder (connect Recharts/Chart.js)
- `DataTable`: Data table with sorting/filtering
- `Section`: Section wrapper
- `Badge`: Status badges
- `EmptyState`: Empty state display

### Forms

- `CreateProjectForm`: Create new projects
- `FinanceEventForm`: Add finance events

## API Client

The API client (`src/lib/hub/api.ts`) handles all backend communication:

```typescript
import { api } from '@/lib/hub/api';

// GET request
const data = await api.get('/metrics/kpis');

// POST request
await api.post('/projects', { name: 'New Project', category: 'SaaS' });
```

## Styling

The hub uses a dark theme with Tailwind CSS:

- Background: `neutral-950`
- Cards: `neutral-900`
- Borders: `neutral-800`
- Primary actions: `indigo-600`

## Deployment

### Cloudflare Pages

1. Push to GitHub
2. Connect repository to Cloudflare Pages
3. Set environment variables (optional):
   - `NEXT_PUBLIC_API_BASE=https://your-backend-api.com/api` (replace with your backend URL)
4. Deploy

**Note:** The frontend works without a backend - it will show empty states until you connect your API.

The project is configured for Cloudflare Pages deployment.

## Customization

### Add New Commands

Edit `src/lib/hub/cmd.ts`:

```typescript
if (normalized.includes('your command')) {
  return api.get('/your/endpoint');
}
```

### Add New Pages

1. Create `src/app/hub/your-page/page.tsx`
2. Add route to `src/components/hub/Sidebar.tsx`
3. Implement page with hub components

### Connect Charts

Replace `Chart.tsx` with your preferred library:

```typescript
import { LineChart, Line } from 'recharts';

export function Chart({ series }) {
  return <LineChart data={series}><Line dataKey="value" /></LineChart>;
}
```

## Next Steps

1. Connect your backend API
2. Replace chart placeholders with real charts
3. Add authentication/authorization
4. Extend command bar with more commands
5. Add real-time updates (WebSockets/SSE)
6. Implement data caching and prefetching

