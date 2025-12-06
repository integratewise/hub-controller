'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Section } from '@/components/hub/Section';
import { Badge } from '@/components/hub/Badge';
import { formatCurrency, formatDate } from '@/lib/hub/format';

type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  budget: number;
  spent: number;
  leads: number;
  startDate?: string;
  endDate?: string;
};

const channels = ['Email', 'Social', 'PPC', 'Content', 'Events', 'SEO', 'Affiliate', 'Other'];
const statuses = ['Draft', 'Active', 'Paused', 'Completed'];

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('Email');
  const [status, setStatus] = useState('Draft');
  const [budget, setBudget] = useState(0);
  const [spent, setSpent] = useState(0);
  const [leads, setLeads] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  async function loadCampaigns() {
    setLoading(true);
    try {
      const data = await api.get('/marketing') as Campaign[];
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCampaigns(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        type: 'campaign',
        title: name,
        status,
        category: channel,
        metadata: { budget, spent, leads, startDate, endDate },
      };

      if (editingCampaign) {
        await api.put(`/entities/${editingCampaign.id}`, payload);
      } else {
        await api.post('/entities', payload);
      }
      resetForm();
      loadCampaigns();
    } catch (error) {
      console.error('Failed to save campaign:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/entities/${id}`);
      loadCampaigns();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  }

  function startEdit(campaign: Campaign) {
    setEditingCampaign(campaign);
    setName(campaign.name);
    setChannel(campaign.channel);
    setStatus(campaign.status);
    setBudget(campaign.budget || 0);
    setSpent(campaign.spent || 0);
    setLeads(campaign.leads || 0);
    setStartDate(campaign.startDate || '');
    setEndDate(campaign.endDate || '');
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingCampaign(null);
    setName('');
    setChannel('Email');
    setStatus('Draft');
    setBudget(0);
    setSpent(0);
    setLeads(0);
    setStartDate('');
    setEndDate('');
  }

  // Metrics
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
  const cac = totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0;

  const getStatusBadge = (s: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      'Active': 'success',
      'Paused': 'warning',
      'Draft': 'default',
      'Completed': 'info',
    };
    return <Badge variant={variants[s] || 'default'}>{s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Marketing Dashboard</h1>
          <p className="text-sm text-neutral-400 mt-1">Campaign performance and lead generation</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
        >
          + New Campaign
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Campaign Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  placeholder="Q1 Email Nurture"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  >
                    {channels.map(c => <option key={c} value={c}>{c}</option>)}
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Spent ($)</label>
                  <input
                    type="number"
                    value={spent}
                    onChange={(e) => setSpent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Leads</label>
                  <input
                    type="number"
                    value={leads}
                    onChange={(e) => setLeads(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-neutral-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm">
                  {editingCampaign ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marketing Metrics */}
      <Section title="Key Metrics">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <div className="text-xs text-neutral-400">Total Campaigns</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-green-400">{activeCampaigns}</div>
            <div className="text-xs text-neutral-400">Active</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-blue-400">{totalLeads}</div>
            <div className="text-xs text-neutral-400">Total Leads</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-yellow-400">{formatCurrency(totalSpent)}</div>
            <div className="text-xs text-neutral-400">Total Spent</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-purple-400">{formatCurrency(cac)}</div>
            <div className="text-xs text-neutral-400">CAC</div>
          </div>
        </div>
      </Section>

      {/* Campaigns Table */}
      <Section title="All Campaigns">
        {loading ? (
          <div className="text-neutral-400">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-neutral-500 text-sm">No campaigns yet. Create your first campaign above.</div>
        ) : (
          <div className="rounded border border-neutral-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Campaign</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Budget</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Spent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Leads</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-neutral-800/50">
                    <td className="px-4 py-3 text-sm">{campaign.name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400">{campaign.channel}</td>
                    <td className="px-4 py-3">{getStatusBadge(campaign.status)}</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(campaign.budget || 0)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400">{formatCurrency(campaign.spent || 0)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-400">{campaign.leads || 0}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEdit(campaign)} className="text-indigo-400 hover:text-indigo-300 text-sm mr-3">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(campaign.id)} className="text-red-400 hover:text-red-300 text-sm">
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
