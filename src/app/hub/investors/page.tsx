'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Section } from '@/components/hub/Section';
import { KpiCard } from '@/components/hub/KpiCard';
import { DataTable } from '@/components/hub/DataTable';
import { formatDate } from '@/lib/hub/format';

type InvestorReport = {
  title: string;
  type: string;
  date: string;
  status: string;
};

export default function InvestorsPage() {
  const [reports, setReports] = useState<InvestorReport[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/investors/reports') as InvestorReport[];
        setReports(data);
      } catch (error) {
        console.error('Failed to load investor reports:', error);
        setReports([]);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Investor Relations</h1>
        <p className="text-sm text-neutral-400 mt-1">Investor updates and reporting</p>
      </div>
      
      <Section title="Key Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Total Raised" value={5000000} />
          <KpiCard title="Valuation" value={25000000} />
          <KpiCard title="Investors" value={8} />
          <KpiCard title="Last Round" value="Series A" />
        </div>
      </Section>
      
      <Section title="Investor Reports">
        <DataTable
          columns={[
            { key: 'title', label: 'Report' },
            { key: 'type', label: 'Type' },
            { key: 'date', label: 'Date', render: (value) => formatDate(value as string) },
            { key: 'status', label: 'Status' },
          ]}
          data={reports.length > 0 ? reports : [
            { title: 'Q4 2024 Investor Update', type: 'Quarterly', date: '2024-12-31', status: 'Draft' },
            { title: 'Monthly Metrics - December', type: 'Monthly', date: '2024-12-15', status: 'Sent' },
            { title: 'Board Meeting Deck', type: 'Board', date: '2024-12-10', status: 'Sent' },
          ]}
          emptyMessage="No investor reports found"
        />
      </Section>
    </div>
  );
}

