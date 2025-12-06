'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Section } from '@/components/hub/Section';
import { Badge } from '@/components/hub/Badge';
import { formatDate } from '@/lib/hub/format';

type ComplianceItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  dueDate?: string;
  owner?: string;
  priority: string;
  notes?: string;
};

const categories = ['SOC 2', 'GDPR', 'HIPAA', 'ISO 27001', 'Security', 'Legal', 'HR', 'Finance', 'Other'];
const statuses = ['Complete', 'In Progress', 'Pending', 'Overdue', 'Not Started'];
const priorities = ['low', 'medium', 'high', 'critical'];

export default function OpsPage() {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ComplianceItem | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Security');
  const [status, setStatus] = useState('Not Started');
  const [dueDate, setDueDate] = useState('');
  const [owner, setOwner] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');

  async function loadItems() {
    setLoading(true);
    try {
      const data = await api.get('/ops') as ComplianceItem[];
      setItems(data);
    } catch (error) {
      console.error('Failed to load ops items:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadItems(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        type: 'compliance',
        title,
        status,
        category,
        priority,
        metadata: { dueDate, owner, notes },
      };

      if (editingItem) {
        await api.put(`/entities/${editingItem.id}`, payload);
      } else {
        await api.post('/entities', payload);
      }
      resetForm();
      loadItems();
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/entities/${id}`);
      loadItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  }

  function startEdit(item: ComplianceItem) {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category);
    setStatus(item.status);
    setDueDate(item.dueDate || '');
    setOwner(item.owner || '');
    setPriority(item.priority || 'medium');
    setNotes(item.notes || '');
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingItem(null);
    setTitle('');
    setCategory('Security');
    setStatus('Not Started');
    setDueDate('');
    setOwner('');
    setPriority('medium');
    setNotes('');
  }

  // Metrics
  const completed = items.filter(i => i.status === 'Complete').length;
  const inProgress = items.filter(i => i.status === 'In Progress').length;
  const overdue = items.filter(i => i.status === 'Overdue').length;
  const critical = items.filter(i => i.priority === 'critical' && i.status !== 'Complete').length;
  const completionRate = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  const getStatusBadge = (s: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      'Complete': 'success',
      'In Progress': 'info',
      'Pending': 'warning',
      'Overdue': 'danger',
      'Not Started': 'default',
    };
    return <Badge variant={variants[s] || 'default'}>{s}</Badge>;
  };

  const getPriorityBadge = (p: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      'critical': 'danger',
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
          <h1 className="text-2xl font-semibold text-neutral-100">Ops & Compliance</h1>
          <p className="text-sm text-neutral-400 mt-1">Operations, compliance, and risk management</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
        >
          + Add Item
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Compliance Item' : 'New Compliance Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  placeholder="SOC 2 Type II Audit"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  >
                    {priorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Owner</label>
                <input
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  placeholder="Security Team"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  placeholder="Additional details..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-neutral-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm">
                  {editingItem ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compliance Metrics */}
      <Section title="Compliance Status">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold">{items.length}</div>
            <div className="text-xs text-neutral-400">Total Items</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-green-400">{completed}</div>
            <div className="text-xs text-neutral-400">Complete</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-blue-400">{inProgress}</div>
            <div className="text-xs text-neutral-400">In Progress</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-red-400">{overdue}</div>
            <div className="text-xs text-neutral-400">Overdue</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-yellow-400">{completionRate}%</div>
            <div className="text-xs text-neutral-400">Completion Rate</div>
          </div>
        </div>
      </Section>

      {/* Critical Items Alert */}
      {critical > 0 && (
        <div className="p-4 rounded bg-red-900/20 border border-red-800">
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-medium">Critical Items:</span>
            <span className="text-red-300">{critical} critical item(s) require attention</span>
          </div>
        </div>
      )}

      {/* Compliance Table */}
      <Section title="Compliance Checklist">
        {loading ? (
          <div className="text-neutral-400">Loading items...</div>
        ) : items.length === 0 ? (
          <div className="text-neutral-500 text-sm">No compliance items yet. Add your first item above.</div>
        ) : (
          <div className="rounded border border-neutral-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-800/50">
                    <td className="px-4 py-3 text-sm">{item.title}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400">{item.category}</td>
                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3">{getPriorityBadge(item.priority)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400">
                      {item.dueDate ? formatDate(item.dueDate) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400">{item.owner || '-'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEdit(item)} className="text-indigo-400 hover:text-indigo-300 text-sm mr-3">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 text-sm">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
