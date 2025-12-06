'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { Section } from '@/components/hub/Section';
import { Badge } from '@/components/hub/Badge';

type TeamMember = {
  id: string;
  name: string;
  role: string;
  department: string;
  utilization: number;
  status: string;
  email?: string;
};

const departments = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'Operations', 'HR', 'Finance'];
const roles = ['Engineer', 'Designer', 'PM', 'Manager', 'Director', 'VP', 'Lead', 'Analyst'];
const statuses = ['Active', 'On Leave', 'Remote', 'Contract'];

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('Engineer');
  const [department, setDepartment] = useState('Engineering');
  const [utilization, setUtilization] = useState(80);
  const [status, setStatus] = useState('Active');
  const [email, setEmail] = useState('');

  async function loadTeam() {
    setLoading(true);
    try {
      const data = await api.get('/team') as TeamMember[];
      setTeam(data);
    } catch (error) {
      console.error('Failed to load team:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTeam(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        type: 'team_member',
        title: name,
        status,
        category: department,
        metadata: { role, utilization, email },
      };

      if (editingMember) {
        await api.put(`/entities/${editingMember.id}`, payload);
      } else {
        await api.post('/entities', payload);
      }
      resetForm();
      loadTeam();
    } catch (error) {
      console.error('Failed to save team member:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this team member?')) return;
    try {
      await api.delete(`/entities/${id}`);
      loadTeam();
    } catch (error) {
      console.error('Failed to delete team member:', error);
    }
  }

  function startEdit(member: TeamMember) {
    setEditingMember(member);
    setName(member.name);
    setRole(member.role);
    setDepartment(member.department);
    setUtilization(member.utilization || 80);
    setStatus(member.status);
    setEmail(member.email || '');
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingMember(null);
    setName('');
    setRole('Engineer');
    setDepartment('Engineering');
    setUtilization(80);
    setStatus('Active');
    setEmail('');
  }

  // Calculate metrics
  const activeMembers = team.filter(m => m.status === 'Active').length;
  const avgUtilization = team.length > 0
    ? Math.round(team.reduce((sum, m) => sum + (m.utilization || 0), 0) / team.length)
    : 0;
  const byDepartment = team.reduce((acc, m) => {
    acc[m.department] = (acc[m.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Team & Culture</h1>
          <p className="text-sm text-neutral-400 mt-1">Team members, utilization, and org structure</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
        >
          + Add Member
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  placeholder="john@company.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Utilization (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={utilization}
                    onChange={(e) => setUtilization(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                  />
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
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-neutral-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm">
                  {editingMember ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Metrics */}
      <Section title="Team Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold">{team.length}</div>
            <div className="text-xs text-neutral-400">Total Members</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-green-400">{activeMembers}</div>
            <div className="text-xs text-neutral-400">Active</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-blue-400">{avgUtilization}%</div>
            <div className="text-xs text-neutral-400">Avg Utilization</div>
          </div>
          <div className="p-4 rounded bg-neutral-800">
            <div className="text-2xl font-bold text-yellow-400">{Object.keys(byDepartment).length}</div>
            <div className="text-xs text-neutral-400">Departments</div>
          </div>
        </div>
      </Section>

      {/* By Department */}
      <Section title="By Department">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(byDepartment).map(([dept, count]) => (
            <div key={dept} className="p-3 rounded bg-neutral-800/50 border border-neutral-700">
              <div className="text-sm font-medium">{dept}</div>
              <div className="text-lg font-bold">{count} members</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Team List */}
      <Section title="Team Members">
        {loading ? (
          <div className="text-neutral-400">Loading team...</div>
        ) : team.length === 0 ? (
          <div className="text-neutral-500 text-sm">No team members yet. Add your first member above.</div>
        ) : (
          <div className="rounded border border-neutral-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Utilization</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {team.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-800/50">
                    <td className="px-4 py-3 text-sm">{member.name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400">{member.role}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400">{member.department}</td>
                    <td className="px-4 py-3">
                      <Badge variant={(member.utilization || 0) >= 80 ? 'success' : (member.utilization || 0) >= 50 ? 'warning' : 'danger'}>
                        {member.utilization || 0}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={member.status === 'Active' ? 'success' : member.status === 'On Leave' ? 'warning' : 'default'}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEdit(member)} className="text-indigo-400 hover:text-indigo-300 text-sm mr-3">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(member.id)} className="text-red-400 hover:text-red-300 text-sm">
                        Remove
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
