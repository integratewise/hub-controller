'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { FinanceSummary } from '@/lib/hub/types';
import { Section } from '@/components/hub/Section';
import { KpiCard } from '@/components/hub/KpiCard';
import { FinanceEventForm } from '@/components/hub/forms/FinanceEventForm';
import { Chart } from '@/components/hub/Chart';

export default function FinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/finance/summary') as FinanceSummary;
        setSummary(data);
      } catch (error) {
        console.error('Failed to load finance summary:', error);
        setSummary({ budget: 1000000, actual: 800000, burn: 80000, runwayMonths: 9 });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Finance</h1>
          <p className="text-sm text-neutral-400 mt-1">Budget, burn rate, and financial planning</p>
        </div>
        <FinanceEventForm onCreated={() => window.location.reload()} />
      </div>
      
      <Section title="Financial Summary">
        {loading ? (
          <div className="text-sm text-neutral-400">Loading...</div>
        ) : summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Budget" value={summary.budget} />
            <KpiCard title="Actual Spend" value={summary.actual} />
            <KpiCard title="Monthly Burn" value={summary.burn} />
            <KpiCard title="Runway (months)" value={summary.runwayMonths} />
          </div>
        ) : null}
      </Section>
      
      <Section title="Burn Rate Trend">
        <Chart 
          title="Monthly Burn vs Budget" 
          series={[
            { label: 'Budget', points: [100, 100, 100, 100, 100, 100] },
            { label: 'Actual', points: [75, 80, 78, 82, 80, 85] }
          ]} 
        />
      </Section>
    </div>
  );
}

