'use client';
import { useState } from 'react';
import { Section, CardSection } from '@/components/hub/Section';
import { DataTable } from '@/components/hub/DataTable';
import { Badge } from '@/components/hub/Badge';
import { 
  Cloud, 
  Database, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Settings2,
  Key,
  Users,
  Building2,
  Globe,
  Zap,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';

// Integration definitions
const integrations = [
  { 
    id: 'salesforce',
    name: 'Salesforce', 
    icon: Cloud,
    category: 'CRM',
    status: 'connected',
    lastSync: '2024-12-20T10:30:00Z',
    description: 'Sync opportunities, accounts, contacts',
    fields: ['Opportunities', 'Accounts', 'Contacts', 'Activities'],
  },
  { 
    id: 'notion',
    name: 'Notion', 
    icon: FileText,
    category: 'Docs',
    status: 'connected',
    lastSync: '2024-12-20T09:15:00Z',
    description: 'Sync pages, databases, and content',
    fields: ['Pages', 'Databases', 'Comments'],
  },
  { 
    id: 'zoho',
    name: 'Zoho Books', 
    icon: Database,
    category: 'Finance',
    status: 'connected',
    lastSync: '2024-12-20T08:45:00Z',
    description: 'Sync invoices, expenses, transactions',
    fields: ['Invoices', 'Expenses', 'Payments', 'Contacts'],
  },
  { 
    id: 'gdrive',
    name: 'Google Drive', 
    icon: Cloud,
    category: 'Storage',
    status: 'connected',
    lastSync: '2024-12-20T07:30:00Z',
    description: 'Sync files and documents',
    fields: ['Files', 'Folders', 'Permissions'],
  },
  { 
    id: 'mulesoft',
    name: 'MuleSoft', 
    icon: Zap,
    category: 'Integration',
    status: 'pending',
    lastSync: null,
    description: 'API integration platform',
    fields: ['APIs', 'Flows', 'Connectors'],
  },
  { 
    id: 'airtable',
    name: 'Airtable', 
    icon: Database,
    category: 'Database',
    status: 'disconnected',
    lastSync: '2024-12-15T14:20:00Z',
    description: 'Sync bases and records',
    fields: ['Bases', 'Tables', 'Records'],
  },
];

const apiTokens = [
  { id: '1', name: 'Production API Key', prefix: 'iw_live_', created: '2024-11-15', lastUsed: '2024-12-20', scopes: ['read', 'write'] },
  { id: '2', name: 'Development Key', prefix: 'iw_test_', created: '2024-12-01', lastUsed: '2024-12-19', scopes: ['read'] },
  { id: '3', name: 'CI/CD Pipeline', prefix: 'iw_ci_', created: '2024-12-10', lastUsed: '2024-12-20', scopes: ['read', 'write', 'admin'] },
];

const teamMembers = [
  { id: '1', email: 'admin@integratewise.co', name: 'Admin User', role: 'Admin', status: 'active', lastLogin: '2024-12-20T10:00:00Z' },
  { id: '2', email: 'ops@integratewise.co', name: 'Ops Manager', role: 'Manager', status: 'active', lastLogin: '2024-12-20T08:30:00Z' },
  { id: '3', email: 'dev@integratewise.co', name: 'Developer', role: 'Developer', status: 'active', lastLogin: '2024-12-19T16:45:00Z' },
  { id: '4', email: 'viewer@integratewise.co', name: 'Viewer User', role: 'Viewer', status: 'inactive', lastLogin: '2024-12-10T09:00:00Z' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'integrations' | 'api' | 'team' | 'preferences'>('integrations');
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSync = async (integrationId: string) => {
    setSyncingId(integrationId);
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncingId(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100">Settings</h1>
        <p className="text-sm text-neutral-400 mt-1">Manage integrations, API keys, team, and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-800">
        {[
          { id: 'integrations', label: 'Integrations', icon: Cloud },
          { id: 'api', label: 'API Keys', icon: Key },
          { id: 'team', label: 'Team', icon: Users },
          { id: 'preferences', label: 'Preferences', icon: Settings2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-neutral-100">Connected Integrations</h2>
              <p className="text-sm text-neutral-500">Manage third-party service connections</p>
            </div>
            <button
              onClick={() => setShowAddIntegration(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Integration
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              const isSyncing = syncingId === integration.id;
              return (
                <div
                  key={integration.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-800 rounded-lg">
                        <Icon className="w-5 h-5 text-neutral-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-100">{integration.name}</span>
                          <Badge variant={
                            integration.status === 'connected' ? 'success' :
                            integration.status === 'pending' ? 'warning' : 'danger'
                          }>
                            {integration.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5">{integration.category}</div>
                      </div>
                    </div>
                    {getStatusIcon(integration.status)}
                  </div>
                  
                  <p className="text-sm text-neutral-400 mt-3">{integration.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {integration.fields.map((field) => (
                      <span key={field} className="text-xs px-2 py-0.5 bg-neutral-800 rounded text-neutral-400">
                        {field}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-800">
                    <div className="text-xs text-neutral-500">
                      {integration.lastSync 
                        ? `Last sync: ${new Date(integration.lastSync).toLocaleString()}`
                        : 'Never synced'}
                    </div>
                    <div className="flex items-center gap-2">
                      {integration.status === 'connected' && (
                        <button
                          onClick={() => handleSync(integration.id)}
                          disabled={isSyncing}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                          {isSyncing ? 'Syncing...' : 'Sync'}
                        </button>
                      )}
                      <button className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200">
                        <Settings2 className="w-3 h-3" />
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-neutral-100">API Keys</h2>
              <p className="text-sm text-neutral-500">Manage API access tokens</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm transition-colors">
              <Plus className="w-4 h-4" />
              Create Key
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Key Prefix</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Scopes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Last Used</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiTokens.map((token) => (
                  <tr key={token.id} className="border-b border-neutral-800 last:border-0">
                    <td className="px-4 py-3 text-sm text-neutral-200">{token.name}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                        {token.prefix}...
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {token.scopes.map((scope) => (
                          <Badge key={scope} variant="default">{scope}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400">{token.created}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400">{token.lastUsed}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-red-400 hover:text-red-300 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CardSection title="API Documentation">
            <p className="text-sm text-neutral-400 mb-3">
              Access the full API documentation to integrate with the Universal Controller Hub.
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-xs text-neutral-300 bg-neutral-800 px-3 py-2 rounded">
                {process.env.NEXT_PUBLIC_API_BASE || 'https://api.controller.integratewise.xyz'}
              </code>
              <a
                href="#"
                className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
              >
                View Docs <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </CardSection>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-neutral-100">Team Members</h2>
              <p className="text-sm text-neutral-500">Manage user access and permissions</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm transition-colors">
              <Plus className="w-4 h-4" />
              Invite Member
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Last Login</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id} className="border-b border-neutral-800 last:border-0">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm text-neutral-200">{member.name}</div>
                        <div className="text-xs text-neutral-500">{member.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={member.role === 'Admin' ? 'info' : 'default'}>{member.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={member.status === 'active' ? 'success' : 'warning'}>{member.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400">
                      {new Date(member.lastLogin).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-indigo-400 hover:text-indigo-300 text-xs">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <Section title="General Preferences">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                <div>
                  <div className="text-sm text-neutral-200">Dark Mode</div>
                  <div className="text-xs text-neutral-500">Use dark theme throughout the app</div>
                </div>
                <button className="w-12 h-6 bg-indigo-600 rounded-full relative">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                <div>
                  <div className="text-sm text-neutral-200">Email Notifications</div>
                  <div className="text-xs text-neutral-500">Receive email alerts for important events</div>
                </div>
                <button className="w-12 h-6 bg-indigo-600 rounded-full relative">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                <div>
                  <div className="text-sm text-neutral-200">Auto-sync Integrations</div>
                  <div className="text-xs text-neutral-500">Automatically sync data every hour</div>
                </div>
                <button className="w-12 h-6 bg-neutral-700 rounded-full relative">
                  <span className="absolute left-1 top-1 w-4 h-4 bg-neutral-400 rounded-full"></span>
                </button>
              </div>
            </div>
          </Section>

          <Section title="Organization">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-lg font-medium text-neutral-100">IntegrateWise</div>
                  <div className="text-sm text-neutral-500">controller.integratewise.xyz</div>
                  <div className="text-xs text-neutral-500 mt-1">Plan: Enterprise · 24 team members</div>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Danger Zone">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-red-400">Delete Organization</div>
                  <div className="text-xs text-neutral-500">Permanently delete all data and settings</div>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-500 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

