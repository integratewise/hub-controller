'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Section } from '@/components/hub/Section';
import { Badge } from '@/components/hub/Badge';
import { formatCurrency, formatDate } from '@/lib/hub/format';

type Opportunity = {
  id: string;
  name: string;
  stage: string;
  amount: number;
  closeDate?: string;
  account?: string;
  probability?: number;
};

const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

export default function SalesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [account, setAccount] = useState('');
  const [stage, setStage] = useState('Prospecting');
  const [amount, setAmount] = useState(0);
  const [probability, setProbability] = useState(20);
  const [closeDate, setCloseDate] = useState('');

  async function loadOpportunities() {
    setLoading(true);
    try {
      const data = await api.get('/opportunities') as Opportunity[];
      setOpportunities(data);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOpportunities(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        type: 'opportunity',
        title: name,
        status: stage,
        category: account,
        metadata: { amount, probability, closeDate, account },
      };

      if (editingOpp) {
        await api.put(`/entities/${editingOpp.id}`, payload);
      } else {
        await api.post('/entities', payload);
      }
      resetForm();
      loadOpportunities();
    } catch (error) {
      console.error('Failed to save opportunity:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this opportunity?')) return;
    try {
      await api.delete(`/entities/${id}`);
      loadOpportunities();
    } catch (error) {
      console.error('Failed to delete opportunity:', error);
    }
  }

  function startEdit(opp: Opportunity) {
    setEditingOpp(opp);
    setName(opp.name);
    setAccount(opp.account || '');
    setStage(opp.stage);
    setAmount(opp.amount || 0);
    setProbability(opp.probability || 20);
    setCloseDate(opp.closeDate || '');
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingOpp(null);
    setName('');
    setAccount('');
    setStage('Prospecting');
    setAmount(0);
    setProbability(20);
    setCloseDate('');
  }

  const getStageBadge = (s: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      'Closed Won': 'success',
      'Closed Lost': 'danger',
      'Negotiation': 'warning',
      'Proposal': 'info',
    };
    return <Badge variant={variants[s] || 'default'}>{s}</Badge>;
  };

  const totalPipeline = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
  const weightedPipeline = opportunities.reduce((sum, opp) => sum + ((opp.amount || 0) * (opp.probability || 0) / 100), 0);
  const wonDeals = opportunities.filter(o => o.stage === 'Closed Won');
  const wonAmount = wonDeals.reduce((sum, o) => sum + (o.amount || 0), 0);
  const activeDeals = opportunities.filter(o => !o.stage.startsWith('Closed'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Sales Pipeline</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage opportunities and deals</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
        >
          + New Opportunity
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingOpp ? 'Edit Opportunity' : 'New Opportunity'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Deal Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  placeholder="Enterprise Deal - Acme Corp"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Account</label>
                <input
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  placeholder="Company name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  >
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={probability}
                    onChange={(e) => setProbability(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Close Date</label>
                  <input
                    type="date"
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-neutral-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm">
                  {editingOpp ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pipeline Summary */}
      <Section title="Pipeline Summary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold">{formatCurrency(totalPipeline)}</div>
            <div className="text-xs text-neutral-400">Total Pipeline</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-blue-400">{formatCurrency(weightedPipeline)}</div>
            <div className="text-xs text-neutral-400">Weighted Pipeline</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(wonAmount)}</div>
            <div className="text-xs text-neutral-400">Won This Period</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-yellow-400">{activeDeals.length}</div>
            <div className="text-xs text-neutral-400">Active Deals</div>
          </div>
        </div>
      </Section>

      {/* Pipeline by Stage */}
      <Section title="Pipeline by Stage">
        {loading ? (
          <div className="text-neutral-400">Loading opportunities...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stages.map((stg) => {
              const stageOpps = opportunities.filter(o => o.stage === stg);
              const stageAmount = stageOpps.reduce((sum, o) => sum + (o.amount || 0), 0);
              return (
                <div key={stg} className="rounded border border-neutral-800 bg-neutral-900">
                  <div className="px-3 py-2 border-b border-neutral-800">
                    <div className="text-xs font-medium text-neutral-400">{stg}</div>
                    <div className="text-sm font-bold">{formatCurrency(stageAmount)}</div>
                  </div>
                  <ul className="p-2 space-y-1 min-h-[100px] max-h-[200px] overflow-y-auto">
                    {stageOpps.length > 0 ? stageOpps.map((opp) => (
                      <li
                        key={opp.id}
                        className="p-2 rounded bg-neutral-800/50 hover:bg-neutral-800 cursor-pointer text-xs group"
                        onClick={() => startEdit(opp)}
                      >
                        <div className="flex justify-between">
                          <span className="truncate">{opp.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(opp.id); }}
                            className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                          >
                            ×
                          </button>
                        </div>
                        <div className="text-neutral-500">{formatCurrency(opp.amount || 0)}</div>
                      </li>
                    )) : (
                      <li className="text-xs text-neutral-500 p-2">No deals</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Opportunities Table */}
      <Section title="All Opportunities">
        {opportunities.length === 0 ? (
          <div className="text-neutral-500 text-sm">No opportunities yet. Create your first deal above.</div>
        ) : (
          <div className="rounded border border-neutral-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Deal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Account</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Close Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-neutral-800/50">
                    <td className="px-4 py-3 text-sm">{opp.name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400">{opp.account || '-'}</td>
                    <td className="px-4 py-3">{getStageBadge(opp.stage)}</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(opp.amount || 0)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400">
                      {opp.closeDate ? formatDate(opp.closeDate) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEdit(opp)} className="text-indigo-400 hover:text-indigo-300 text-sm mr-3">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(opp.id)} className="text-red-400 hover:text-red-300 text-sm">
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
