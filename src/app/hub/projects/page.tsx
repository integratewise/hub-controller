'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Project } from '@/lib/hub/types';
import { CreateProjectForm } from '@/components/hub/forms/CreateProjectForm';
import { Badge } from '@/components/hub/Badge';

const categories = ['Startup', 'SaaS', 'Services', 'Sales', 'Marketing'];

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/projects') as Project[];
      setItems(r);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => { load(); }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Done': 'success',
      'Active': 'info',
      'Blocked': 'danger',
      'Planned': 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Projects Hub</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage projects across all categories</p>
        </div>
        <CreateProjectForm onCreated={load} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((c) => {
          const categoryProjects = items.filter(i => i.category === c);
          return (
            <div key={c} className="rounded border border-neutral-800 bg-neutral-900">
              <div className="px-4 py-3 border-b border-neutral-800 text-sm font-medium text-neutral-100">
                {c}
              </div>
              <ul className="p-3 space-y-2 min-h-[200px]">
                {loading ? (
                  <li className="text-xs text-neutral-500">Loading...</li>
                ) : categoryProjects.length > 0 ? (
                  categoryProjects.map((i) => (
                    <li key={i.id || i.name} className="flex items-center justify-between p-2 rounded hover:bg-neutral-800 transition-colors">
                      <span className="text-sm text-neutral-300">{i.name}</span>
                      {getStatusBadge(i.status)}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-neutral-500">No projects yet</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

