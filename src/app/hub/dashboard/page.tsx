'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { KpiCard } from '@/components/hub/KpiCard';
import { Chart } from '@/components/hub/Chart';
import { Section } from '@/components/hub/Section';

type KPI = { key: string; value: number };
type ChartSeries = { label: string; points: number[] };

export default function MetricsPage() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [series, setSeries] = useState<ChartSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/metrics/kpis?period=month') as KPI[];
        setKpis(data);
      } catch (error) {
        console.error('Failed to load KPIs:', error);
        setKpis([]);
      } finally {
        setLoading(false);
      }
    }
    load();
    
    // Replace with real data from API
    setSeries([
      { label: 'MRR', points: [100, 110, 120, 125] },
      { label: 'Burn', points: [70, 75, 80, 82] }
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Metrics & Executive Dashboard</h1>
        <p className="text-sm text-neutral-400 mt-1">Key performance indicators and trends</p>
      </div>
      
      <Section title="Key Metrics">
        {loading ? (
          <div className="text-sm text-neutral-400">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.length > 0 ? (
              kpis.map((k) => <KpiCard key={k.key} title={k.key} value={k.value} />)
            ) : (
              <>
                <KpiCard title="MRR" value={120000} />
                <KpiCard title="Burn" value={80000} />
                <KpiCard title="Runway" value={9} />
                <KpiCard title="Growth %" value={15.5} />
              </>
            )}
          </div>
        )}
      </Section>
      
      <Section title="Trends">
        <Chart title="MRR vs Burn" series={series} />
      </Section>
    </div>
  );
}

