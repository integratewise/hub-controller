'use client';
import { useState } from 'react';
import { api } from '@/lib/hub/api';

export function CreateProjectForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('SaaS');
  const [status, setStatus] = useState('Planned');
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post('/projects', { name, category, status });
      setName('');
      onCreated?.();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        className="rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        placeholder="Project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select
        className="rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option>Startup</option>
        <option>SaaS</option>
        <option>Services</option>
        <option>Sales</option>
        <option>Marketing</option>
      </select>
      <select
        className="rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option>Planned</option>
        <option>Active</option>
        <option>Blocked</option>
        <option>Done</option>
      </select>
      <button
        className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        onClick={create}
        disabled={loading || !name.trim()}
      >
        {loading ? 'Creating...' : 'Create'}
      </button>
    </div>
  );
}

