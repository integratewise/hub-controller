'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Section } from '@/components/hub/Section';
import { KpiCard } from '@/components/hub/KpiCard';
import { DataTable } from '@/components/hub/DataTable';
import { Badge } from '@/components/hub/Badge';

type RndProject = {
  name: string;
  category: string;
  status: string;
  progress: number;
};

export default function RndPage() {
  const [projects, setProjects] = useState<RndProject[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/rnd/projects') as RndProject[];
        setProjects(data);
      } catch (error) {
        console.error('Failed to load R&D projects:', error);
        setProjects([]);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Innovation & R&D</h1>
        <p className="text-sm text-neutral-400 mt-1">Research projects and innovation pipeline</p>
      </div>
      
      <Section title="R&D Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Active Projects" value={projects.length || 5} />
          <KpiCard title="Patents Filed" value={2} />
          <KpiCard title="R&D Spend" value={250000} />
          <KpiCard title="Innovation Index" value={8.5} />
        </div>
      </Section>
      
      <Section title="R&D Projects">
        <DataTable
          columns={[
            { key: 'name', label: 'Project' },
            { key: 'category', label: 'Category' },
            { key: 'status', label: 'Status', render: (value) => (
              <Badge variant={(value as string) === 'Active' ? 'success' : (value as string) === 'Planning' ? 'default' : 'warning'}>
                {value as string}
              </Badge>
            )},
            { key: 'progress', label: 'Progress', render: (value) => `${value as number}%` },
          ]}
          data={projects.length > 0 ? projects : [
            { name: 'AI Agent Framework', category: 'AI/ML', status: 'Active', progress: 75 },
            { name: 'Data Pipeline Optimization', category: 'Infrastructure', status: 'Active', progress: 60 },
            { name: 'Security Enhancement', category: 'Security', status: 'Planning', progress: 20 },
          ]}
          emptyMessage="No R&D projects found"
        />
      </Section>
    </div>
  );
}

