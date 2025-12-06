'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Customer } from '@/lib/hub/types';
import { DataTable } from '@/components/hub/DataTable';
import { Section } from '@/components/hub/Section';
import { KpiCard } from '@/components/hub/KpiCard';
import { Badge } from '@/components/hub/Badge';
import { formatCurrency, formatRelativeTime } from '@/lib/hub/format';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/customers') as Customer[];
        setCustomers(data);
      } catch (error) {
        console.error('Failed to load customers:', error);
        setCustomers([]);
      }
    }
    load();
  }, []);

  const totalMRR = customers.reduce((sum, c) => sum + (c.mrr || 0), 0);
  const avgHealthScore = customers.length > 0
    ? customers.reduce((sum, c) => sum + (c.healthScore || 0), 0) / customers.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Customers</h1>
        <p className="text-sm text-neutral-400 mt-1">Customer health and engagement</p>
      </div>
      
      <Section title="Summary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Total Customers" value={customers.length} />
          <KpiCard title="Total MRR" value={totalMRR} />
          <KpiCard title="Avg Health Score" value={avgHealthScore} />
          <KpiCard title="At Risk" value={customers.filter(c => (c.healthScore || 0) < 50).length} />
        </div>
      </Section>
      
      <Section title="Customer List">
        <DataTable
          columns={[
            { key: 'name', label: 'Customer' },
            { key: 'status', label: 'Status' },
            {
              key: 'mrr',
              label: 'MRR',
              render: (value) => value ? formatCurrency(value as number) : '-'
            },
            {
              key: 'healthScore',
              label: 'Health Score',
              render: (value) => value ? (
                <Badge variant={(value as number) >= 70 ? 'success' : (value as number) >= 50 ? 'warning' : 'danger'}>
                  {value as number}
                </Badge>
              ) : '-'
            },
            {
              key: 'lastActivity',
              label: 'Last Activity',
              render: (value) => value ? formatRelativeTime(value as string) : '-'
            },
          ]}
          data={customers}
          emptyMessage="No customers found"
        />
      </Section>
    </div>
  );
}

