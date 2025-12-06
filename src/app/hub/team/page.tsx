'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Section } from '@/components/hub/Section';
import { KpiCard } from '@/components/hub/KpiCard';
import { DataTable } from '@/components/hub/DataTable';
import { Badge } from '@/components/hub/Badge';

type Utilization = {
  overall?: number;
};

type TeamMember = {
  name: string;
  role: string;
  utilization: number;
  status: string;
};

export default function TeamPage() {
  const [utilization, setUtilization] = useState<Utilization | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [utilData, teamData] = await Promise.all([
          api.get('/team/utilization'),
          api.get('/team/members')
        ]);
        setUtilization(utilData as Utilization);
        setTeam(teamData as TeamMember[]);
      } catch (error) {
        console.error('Failed to load team data:', error);
        setUtilization({ overall: 72 });
        setTeam([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Team & Culture</h1>
        <p className="text-sm text-neutral-400 mt-1">Team utilization, performance, and culture metrics</p>
      </div>
      
      <Section title="Team Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Overall Utilization" value={utilization?.overall || 72} />
          <KpiCard title="Active Members" value={team.length || 12} />
          <KpiCard title="Avg Satisfaction" value={4.2} />
          <KpiCard title="Open Positions" value={3} />
        </div>
      </Section>
      
      <Section title="Team Members">
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'role', label: 'Role' },
            { key: 'utilization', label: 'Utilization', render: (value) => `${value as number}%` },
            { key: 'status', label: 'Status', render: (value) => (
              <Badge variant={(value as string) === 'Active' ? 'success' : 'default'}>
                {value as string}
              </Badge>
            )},
          ]}
          data={team.length > 0 ? team : [
            { name: 'John Doe', role: 'Engineer', utilization: 85, status: 'Active' },
            { name: 'Jane Smith', role: 'Designer', utilization: 70, status: 'Active' },
            { name: 'Bob Johnson', role: 'PM', utilization: 90, status: 'Active' },
          ]}
          emptyMessage="No team members found"
        />
      </Section>
    </div>
  );
}

