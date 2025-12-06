'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Opportunity } from '@/lib/hub/types';
import { DataTable } from '@/components/hub/DataTable';
import { Section } from '@/components/hub/Section';
import { KpiCard } from '@/components/hub/KpiCard';
import { formatCurrency, formatDate } from '@/lib/hub/format';

export default function SalesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/integrations/salesforce/opportunities') as Opportunity[];
        setOpportunities(data);
      } catch (error) {
        console.error('Failed to load opportunities:', error);
        setOpportunities([]);
      }
    }
    load();
  }, []);

  const totalPipeline = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Sales Pipeline & CRM Ops</h1>
        <p className="text-sm text-neutral-400 mt-1">Manage opportunities and sales activities</p>
      </div>
      
      <Section title="Pipeline Summary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Total Pipeline" value={totalPipeline} />
          <KpiCard title="Active Opportunities" value={opportunities.length} />
          <KpiCard title="Avg Deal Size" value={opportunities.length > 0 ? totalPipeline / opportunities.length : 0} />
          <KpiCard title="Win Rate" value={45} />
        </div>
      </Section>
      
      <Section title="Opportunities">
        <DataTable
          columns={[
            { key: 'name', label: 'Opportunity' },
            { key: 'account', label: 'Account' },
            { key: 'stage', label: 'Stage' },
            {
              key: 'amount',
              label: 'Amount',
              render: (value) => formatCurrency((value as number) || 0)
            },
            {
              key: 'closeDate',
              label: 'Close Date',
              render: (value) => value ? formatDate(value as string) : '-'
            },
          ]}
          data={opportunities}
          emptyMessage="No opportunities found"
        />
      </Section>
    </div>
  );
}

