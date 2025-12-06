'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
type DocRef = {
  source: string;
  title: string;
  url: string;
  tags?: string[];
  lastModified?: string;
};
import { Section } from '@/components/hub/Section';
import { Badge } from '@/components/hub/Badge';
import { EmptyState } from '@/components/hub/EmptyState';
import { formatRelativeTime } from '@/lib/hub/format';
import Link from 'next/link';

export default function DocsPage() {
  const [items, setItems] = useState<DocRef[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/integrations/index/docs');
      setItems(Array.isArray(r) ? r : []);
    } catch (error) {
      console.error('Failed to load docs:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Docs Hub</h1>
          <p className="text-sm text-neutral-400 mt-1">Unified document search across all sources</p>
        </div>
        <button
          onClick={load}
          className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          disabled={loading}
        >
          {loading ? 'Indexing...' : 'Refresh Index'}
        </button>
      </div>
      
      <Section title="Documents">
        {loading ? (
          <div className="text-sm text-neutral-400">Loading documents...</div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {items.map((d) => (
              <Link
                key={d.url}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-100 line-clamp-2">{d.title}</div>
                  <Badge variant="info" className="ml-2 flex-shrink-0">{d.source}</Badge>
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  {d.lastModified && formatRelativeTime(d.lastModified)}
                  {d.tags && d.tags.length > 0 && (
                    <span className="ml-2">• {d.tags.slice(0, 2).join(', ')}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState 
            message="No documents found. Click 'Refresh Index' to sync from connected sources."
            action={
              <button
                onClick={load}
                className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 transition-colors"
              >
                Index Documents
              </button>
            }
          />
        )}
      </Section>
    </div>
  );
}

