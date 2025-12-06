import { KpiCard } from '@/components/hub/KpiCard';
import { Section } from '@/components/hub/Section';
import Link from 'next/link';

export default async function HubHome() {
  // Replace with API calls to prefetch data server-side
  const kpis = [
    { key: 'MRR', value: 120000 },
    { key: 'Burn', value: 80000 },
    { key: 'Runway (months)', value: 9 },
    { key: 'Utilization', value: 72 },
  ];
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Executive Summary</h1>
        <p className="text-sm text-neutral-400 mt-1">Overview of key metrics and quick actions</p>
      </div>
      
      <Section title="Key Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <KpiCard key={k.key} title={k.key} value={k.value} />
          ))}
        </div>
      </Section>
      
      <Section title="Quick Links">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/hub/projects"
            className="rounded bg-neutral-900 border border-neutral-800 px-4 py-3 hover:bg-neutral-800 transition-colors"
          >
            <div className="text-sm font-medium text-neutral-100">Projects Hub</div>
            <div className="text-xs text-neutral-400 mt-1">Manage all projects</div>
          </Link>
          <Link
            href="/hub/dashboard"
            className="rounded bg-neutral-900 border border-neutral-800 px-4 py-3 hover:bg-neutral-800 transition-colors"
          >
            <div className="text-sm font-medium text-neutral-100">Metrics Dashboard</div>
            <div className="text-xs text-neutral-400 mt-1">View detailed analytics</div>
          </Link>
          <Link
            href="/hub/docs"
            className="rounded bg-neutral-900 border border-neutral-800 px-4 py-3 hover:bg-neutral-800 transition-colors"
          >
            <div className="text-sm font-medium text-neutral-100">Docs Hub</div>
            <div className="text-xs text-neutral-400 mt-1">Search all documents</div>
          </Link>
        </div>
      </Section>
    </div>
  );
}

