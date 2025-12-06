'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Section } from '@/components/hub/Section';
import { Badge } from '@/components/hub/Badge';
import { formatCurrency } from '@/lib/hub/format';

type Customer = {
  id: string;
  name: string;
  status: string;
  mrr: number;
  healthScore: number;
  lastActivity: string;
};

type CustomerEntity = {
  id: string;
  title: string;
  status: string;
  category?: string;
  metadata?: { mrr?: number; healthScore?: number };
  updated_at: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [status, setStatus] = useState('active');
  const [category, setCategory] = useState('Mid-Market');
  const [mrr, setMrr] = useState(0);
  const [healthScore, setHealthScore] = useState(80);

  async function loadCustomers() {
    setLoading(true);
    try {
      const data = await api.get('/customers') as Customer[];
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCustomers(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        type: 'customer',
        title: name,
        status,
        category,
        metadata: { mrr, healthScore },
      };

      if (editingCustomer) {
        await api.put(`/entities/${editingCustomer.id}`, payload);
      } else {
        await api.post('/entities', payload);
      }
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this customer?')) return;
    try {
      await api.delete(`/entities/${id}`);
      loadCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  }

  function startEdit(customer: Customer) {
    setEditingCustomer(customer);
    setName(customer.name);
    setStatus(customer.status);
    setMrr(customer.mrr || 0);
    setHealthScore(customer.healthScore || 80);
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingCustomer(null);
    setName('');
    setStatus('active');
    setCategory('Mid-Market');
    setMrr(0);
    setHealthScore(80);
  }

  const totalMRR = customers.reduce((sum, c) => sum + (c.mrr || 0), 0);
  const avgHealthScore = customers.length > 0
    ? Math.round(customers.reduce((sum, c) => sum + (c.healthScore || 0), 0) / customers.length)
    : 0;
  const atRisk = customers.filter(c => (c.healthScore || 0) < 50).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Customers</h1>
          <p className="text-sm text-neutral-400 mt-1">Customer health and engagement - your CRM</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
        >
          + Add Customer
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Company Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="churned">Churned</option>
                    <option value="pending">Pending</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Segment</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Mid-Market">Mid-Market</option>
                    <option value="Startup">Startup</option>
                    <option value="SMB">SMB</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">MRR ($)</label>
                  <input
                    type="number"
                    value={mrr}
                    onChange={(e) => setMrr(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Health Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={healthScore}
                    onChange={(e) => setHealthScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-neutral-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm">
                  {editingCustomer ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary KPIs */}
      <Section title="Summary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold">{customers.length}</div>
            <div className="text-xs text-neutral-400">Total Customers</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(totalMRR)}</div>
            <div className="text-xs text-neutral-400">Total MRR</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-blue-400">{avgHealthScore}</div>
            <div className="text-xs text-neutral-400">Avg Health Score</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-red-400">{atRisk}</div>
            <div className="text-xs text-neutral-400">At Risk</div>
          </div>
        </div>
      </Section>

      {/* Customer List */}
      <Section title="Customer List">
        {loading ? (
          <div className="text-neutral-400">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="text-neutral-500 text-sm">No customers yet. Add your first customer above.</div>
        ) : (
          <div className="rounded border border-neutral-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">MRR</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Health</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-800/50">
                    <td className="px-4 py-3 text-sm">{c.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.status === 'active' ? 'success' : c.status === 'churned' ? 'danger' : 'default'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(c.mrr || 0)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={(c.healthScore || 0) >= 70 ? 'success' : (c.healthScore || 0) >= 50 ? 'warning' : 'danger'}>
                        {c.healthScore || 0}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEdit(c)} className="text-indigo-400 hover:text-indigo-300 text-sm mr-3">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300 text-sm">
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
