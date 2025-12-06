'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Section } from '@/components/hub/Section';
import { KpiCard } from '@/components/hub/KpiCard';
import { DataTable } from '@/components/hub/DataTable';
import { Badge } from '@/components/hub/Badge';

type ComplianceItem = {
  item: string;
  status: string;
  dueDate: string;
  owner: string;
};

export default function OpsPage() {
  const [compliance, setCompliance] = useState<ComplianceItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/ops/compliance') as ComplianceItem[];
        setCompliance(data);
      } catch (error) {
        console.error('Failed to load compliance data:', error);
        setCompliance([]);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Ops & Compliance</h1>
        <p className="text-sm text-neutral-400 mt-1">Operations, compliance, and risk management</p>
      </div>
      
      <Section title="Compliance Status">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="SOC 2 Status" value="Active" />
          <KpiCard title="GDPR Compliance" value="100%" />
          <KpiCard title="Open Issues" value={2} />
          <KpiCard title="Last Audit" value="2024-01" />
        </div>
      </Section>
      
      <Section title="Compliance Checklist">
        <DataTable
          columns={[
            { key: 'item', label: 'Item' },
            { key: 'status', label: 'Status', render: (value) => (
              <Badge variant={(value as string) === 'Complete' ? 'success' : 'warning'}>
                {value as string}
              </Badge>
            )},
            { key: 'dueDate', label: 'Due Date' },
            { key: 'owner', label: 'Owner' },
          ]}
          data={compliance.length > 0 ? compliance : [
            { item: 'SOC 2 Type II Audit', status: 'Complete', dueDate: '2024-12-31', owner: 'Security Team' },
            { item: 'GDPR Review', status: 'Complete', dueDate: '2024-12-31', owner: 'Legal' },
            { item: 'Security Training', status: 'Pending', dueDate: '2025-01-15', owner: 'HR' },
          ]}
          emptyMessage="No compliance items"
        />
      </Section>
    </div>
  );
}

