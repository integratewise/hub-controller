'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Badge } from '@/components/hub/Badge';
import { Section } from '@/components/hub/Section';

type Project = {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  priority: string;
  owner?: string;
};

const categories = ['Startup', 'SaaS', 'Services', 'Sales', 'Marketing'];
const statuses = ['active', 'completed', 'blocked', 'pending'];
const priorities = ['low', 'medium', 'high', 'urgent'];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SaaS');
  const [status, setStatus] = useState('active');
  const [priority, setPriority] = useState('medium');

  async function loadProjects() {
    setLoading(true);
    try {
      const data = await api.get('/projects') as Project[];
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProjects(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingProject) {
        await api.put(`/entities/${editingProject.id}`, { title, description, category, status, priority });
      } else {
        await api.post('/projects', { title, description, category, status, priority });
      }
      resetForm();
      loadProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project?')) return;
    try {
      await api.delete(`/entities/${id}`);
      loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  }

  function startEdit(project: Project) {
    setEditingProject(project);
    setTitle(project.title);
    setDescription(project.description || '');
    setCategory(project.category);
    setStatus(project.status);
    setPriority(project.priority);
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingProject(null);
    setTitle('');
    setDescription('');
    setCategory('SaaS');
    setStatus('active');
    setPriority('medium');
  }

  const getStatusBadge = (s: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      'completed': 'success',
      'active': 'info',
      'blocked': 'danger',
      'pending': 'warning',
    };
    return <Badge variant={variants[s] || 'default'}>{s}</Badge>;
  };

  const getPriorityBadge = (p: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      'urgent': 'danger',
      'high': 'warning',
      'medium': 'default',
      'low': 'success',
    };
    return <Badge variant={variants[p] || 'default'}>{p}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Projects Hub</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage all your projects in one place</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
        >
          + New Project
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingProject ? 'Edit Project' : 'New Project'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  placeholder="Project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  placeholder="Project description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  >
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
                >
                  {editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects by Category */}
      {loading ? (
        <div className="text-neutral-400">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const catProjects = projects.filter(p => p.category === cat);
            return (
              <div key={cat} className="rounded border border-neutral-800 bg-neutral-900">
                <div className="px-4 py-3 border-b border-neutral-800 flex justify-between items-center">
                  <span className="text-sm font-medium">{cat}</span>
                  <span className="text-xs text-neutral-500">{catProjects.length}</span>
                </div>
                <ul className="p-2 space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto">
                  {catProjects.length > 0 ? catProjects.map((p) => (
                    <li
                      key={p.id}
                      className="p-3 rounded bg-neutral-800/50 hover:bg-neutral-800 cursor-pointer group"
                      onClick={() => startEdit(p)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-neutral-200">{p.title}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                          className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs"
                        >
                          ×
                        </button>
                      </div>
                      {p.description && (
                        <p className="text-xs text-neutral-500 mb-2 line-clamp-2">{p.description}</p>
                      )}
                      <div className="flex gap-2">
                        {getStatusBadge(p.status)}
                        {getPriorityBadge(p.priority)}
                      </div>
                    </li>
                  )) : (
                    <li className="text-xs text-neutral-500 p-3">No projects</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      <Section title="Summary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold">{projects.length}</div>
            <div className="text-xs text-neutral-400">Total Projects</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-blue-400">
              {projects.filter(p => p.status === 'active').length}
            </div>
            <div className="text-xs text-neutral-400">Active</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-green-400">
              {projects.filter(p => p.status === 'completed').length}
            </div>
            <div className="text-xs text-neutral-400">Completed</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-red-400">
              {projects.filter(p => p.priority === 'urgent' || p.priority === 'high').length}
            </div>
            <div className="text-xs text-neutral-400">High Priority</div>
          </div>
        </div>
      </Section>
    </div>
  );
}
