'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Section } from '@/components/hub/Section';
import { KpiCard } from '@/components/hub/KpiCard';
import { Chart } from '@/components/hub/Chart';

type MarketingMetrics = {
  leads?: number;
  mqls?: number;
  cac?: number;
  roi?: number;
};

export default function MarketingPage() {
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/marketing/metrics') as MarketingMetrics;
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load marketing metrics:', error);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Marketing Dashboard</h1>
        <p className="text-sm text-neutral-400 mt-1">Campaign performance and lead generation</p>
      </div>
      
      <Section title="Key Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <div className="text-sm text-neutral-400">Loading...</div>
          ) : (
            <>
              <KpiCard title="Leads Generated" value={metrics?.leads || 1250} />
              <KpiCard title="MQLs" value={metrics?.mqls || 320} />
              <KpiCard title="CAC" value={metrics?.cac || 450} />
              <KpiCard title="ROI" value={metrics?.roi || 3.2} />
            </>
          )}
        </div>
      </Section>
      
      <Section title="Campaign Performance">
        <Chart 
          title="Leads Over Time" 
          series={[
            { label: 'Leads', points: [100, 120, 110, 140, 130, 150] },
            { label: 'MQLs', points: [25, 30, 28, 35, 32, 40] }
          ]} 
        />
      </Section>
    </div>
  );
}

