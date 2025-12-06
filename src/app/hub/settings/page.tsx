'use client';
import { useState } from 'react';
import { Section } from '@/components/hub/Section';
import { DataTable } from '@/components/hub/DataTable';
import { Badge } from '@/components/hub/Badge';

export default function SettingsPage() {
  const tokens = [
    { name: 'Salesforce', status: 'Connected', lastSync: '2024-12-20T10:30:00Z' },
    { name: 'Notion', status: 'Connected', lastSync: '2024-12-20T09:15:00Z' },
    { name: 'Coda', status: 'Connected', lastSync: '2024-12-20T08:45:00Z' },
    { name: 'Airtable', status: 'Expired', lastSync: '2024-12-15T14:20:00Z' },
  ];

  const roles = [
    { user: 'admin@integratewise.co', role: 'Admin', tenant: 'Default' },
    { user: 'user@integratewise.co', role: 'User', tenant: 'Default' },
    { user: 'viewer@integratewise.co', role: 'Viewer', tenant: 'Default' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Settings</h1>
        <p className="text-sm text-neutral-400 mt-1">Tokens, roles, and tenant configuration</p>
      </div>
      
      <Section title="Integration Tokens">
        <DataTable
          columns={[
            { key: 'name', label: 'Integration' },
            { key: 'status', label: 'Status', render: (value) => (
              <Badge variant={(value as string) === 'Connected' ? 'success' : 'danger'}>
                {value as string}
              </Badge>
            )},
            { key: 'lastSync', label: 'Last Sync', render: (value) => new Date(value as string).toLocaleString() },
            { 
              key: 'actions', 
              label: 'Actions',
              render: () => (
                <button className="text-xs text-indigo-400 hover:text-indigo-300">
                  Manage
                </button>
              )
            },
          ]}
          data={tokens}
          emptyMessage="No integrations configured"
        />
      </Section>
      
      <Section title="User Roles & Permissions">
        <DataTable
          columns={[
            { key: 'user', label: 'User' },
            { key: 'role', label: 'Role', render: (value) => (
              <Badge variant="default">{value as string}</Badge>
            )},
            { key: 'tenant', label: 'Tenant' },
            { 
              key: 'actions', 
              label: 'Actions',
              render: () => (
                <button className="text-xs text-indigo-400 hover:text-indigo-300">
                  Edit
                </button>
              )
            },
          ]}
          data={roles}
          emptyMessage="No users found"
        />
      </Section>
      
      <Section title="API Configuration">
        <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
          <div className="text-sm text-neutral-300 mb-2">
            API Base URL: <code className="text-indigo-400">{process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api'}</code>
          </div>
          <div className="text-xs text-neutral-400">
            Configure this in your environment variables or .env.local file
          </div>
        </div>
      </Section>
    </div>
  );
}

