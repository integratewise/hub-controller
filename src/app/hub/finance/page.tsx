'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Section } from '@/components/hub/Section';
import { Badge } from '@/components/hub/Badge';
import { formatCurrency, formatDate } from '@/lib/hub/format';

type FinanceEntry = {
  id: string;
  title: string;
  type: 'income' | 'expense' | 'budget';
  amount: number;
  category: string;
  date: string;
  status: string;
  notes?: string;
};

const categories = ['Revenue', 'Payroll', 'Marketing', 'Operations', 'R&D', 'Legal', 'Infrastructure', 'Other'];
const types = ['income', 'expense', 'budget'] as const;

export default function FinancePage() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'budget'>('expense');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('Operations');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  async function loadEntries() {
    setLoading(true);
    try {
      const data = await api.get('/finance') as FinanceEntry[];
      setEntries(data);
    } catch (error) {
      console.error('Failed to load finance entries:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEntries(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        type: 'finance',
        title,
        status: type,
        category,
        metadata: { amount, date, notes, entryType: type },
      };

      if (editingEntry) {
        await api.put(`/entities/${editingEntry.id}`, payload);
      } else {
        await api.post('/entities', payload);
      }
      resetForm();
      loadEntries();
    } catch (error) {
      console.error('Failed to save finance entry:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.delete(`/entities/${id}`);
      loadEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  }

  function startEdit(entry: FinanceEntry) {
    setEditingEntry(entry);
    setTitle(entry.title);
    setType(entry.type);
    setAmount(entry.amount || 0);
    setCategory(entry.category);
    setDate(entry.date || new Date().toISOString().split('T')[0]);
    setNotes(entry.notes || '');
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingEntry(null);
    setTitle('');
    setType('expense');
    setAmount(0);
    setCategory('Operations');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  }

  // Calculate summaries
  const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalBudget = entries.filter(e => e.type === 'budget').reduce((sum, e) => sum + (e.amount || 0), 0);
  const netCashflow = totalIncome - totalExpenses;
  const burnRate = totalExpenses; // Simplified monthly burn
  const runway = burnRate > 0 ? Math.round((totalIncome + 500000) / burnRate) : 0; // Assuming some cash reserve

  const getTypeBadge = (t: string) => {
    const variants: Record<string, 'success' | 'danger' | 'info' | 'default'> = {
      'income': 'success',
      'expense': 'danger',
      'budget': 'info',
    };
    return <Badge variant={variants[t] || 'default'}>{t}</Badge>;
  };

  // Group by category for expense breakdown
  const expensesByCategory = entries
    .filter(e => e.type === 'expense')
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Finance</h1>
          <p className="text-sm text-neutral-400 mt-1">Budget, expenses, and financial planning</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
        >
          + Add Entry
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingEntry ? 'Edit Entry' : 'New Finance Entry'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Description</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  placeholder="Monthly AWS bill"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'income' | 'expense' | 'budget')}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  >
                    {types.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                    min="0"
                  />
                </div>
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
                  <label className="block text-sm text-neutral-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  placeholder="Optional notes..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-neutral-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm">
                  {editingEntry ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <Section title="Financial Summary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(totalIncome)}</div>
            <div className="text-xs text-neutral-400">Total Income</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-red-400">{formatCurrency(totalExpenses)}</div>
            <div className="text-xs text-neutral-400">Total Expenses</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(netCashflow)}
            </div>
            <div className="text-xs text-neutral-400">Net Cashflow</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-blue-400">{runway} mo</div>
            <div className="text-xs text-neutral-400">Est. Runway</div>
          </div>
        </div>
      </Section>

      {/* Expense Breakdown */}
      <Section title="Expense Breakdown">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(expensesByCategory).map(([cat, amt]) => (
            <div key={cat} className="p-3 rounded bg-neutral-800/50 border border-neutral-700">
              <div className="text-sm font-medium">{cat}</div>
              <div className="text-lg font-bold text-red-400">{formatCurrency(amt)}</div>
              <div className="text-xs text-neutral-500">
                {totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0}% of total
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Entries Table */}
      <Section title="All Entries">
        {loading ? (
          <div className="text-neutral-400">Loading entries...</div>
        ) : entries.length === 0 ? (
          <div className="text-neutral-500 text-sm">No finance entries yet. Add your first entry above.</div>
        ) : (
          <div className="rounded border border-neutral-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-neutral-800/50">
                    <td className="px-4 py-3 text-sm">{entry.title}</td>
                    <td className="px-4 py-3">{getTypeBadge(entry.type)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400">{entry.category}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${entry.type === 'income' ? 'text-green-400' : entry.type === 'expense' ? 'text-red-400' : ''}`}>
                      {entry.type === 'income' ? '+' : entry.type === 'expense' ? '-' : ''}{formatCurrency(entry.amount || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400">
                      {entry.date ? formatDate(entry.date) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEdit(entry)} className="text-indigo-400 hover:text-indigo-300 text-sm mr-3">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-300 text-sm">
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
