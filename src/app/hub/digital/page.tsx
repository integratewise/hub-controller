'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Section } from '@/components/hub/Section';
import { KpiCard } from '@/components/hub/KpiCard';
import { DataTable } from '@/components/hub/DataTable';
import { Badge } from '@/components/hub/Badge';

type System = {
  name: string;
  type: string;
  status: string;
  uptime: string;
};

export default function DigitalPage() {
  const [systems, setSystems] = useState<System[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/digital/systems') as System[];
        setSystems(data);
      } catch (error) {
        console.error('Failed to load digital systems:', error);
        setSystems([]);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Digital Presence & IT</h1>
        <p className="text-sm text-neutral-400 mt-1">IT infrastructure and digital assets</p>
      </div>
      
      <Section title="System Status">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Uptime" value="99.9%" />
          <KpiCard title="Active Systems" value={systems.length || 8} />
          <KpiCard title="Incidents (24h)" value={0} />
          <KpiCard title="Response Time" value="120ms" />
        </div>
      </Section>
      
      <Section title="Systems & Services">
        <DataTable
          columns={[
            { key: 'name', label: 'System' },
            { key: 'type', label: 'Type' },
            { key: 'status', label: 'Status', render: (value) => (
              <Badge variant={(value as string) === 'Operational' ? 'success' : (value as string) === 'Degraded' ? 'warning' : 'danger'}>
                {value as string}
              </Badge>
            )},
            { key: 'uptime', label: 'Uptime' },
          ]}
          data={systems.length > 0 ? systems : [
            { name: 'API Gateway', type: 'Infrastructure', status: 'Operational', uptime: '99.9%' },
            { name: 'Database', type: 'Data', status: 'Operational', uptime: '99.8%' },
            { name: 'CDN', type: 'Infrastructure', status: 'Operational', uptime: '100%' },
          ]}
          emptyMessage="No systems found"
        />
      </Section>
    </div>
  );
}

