'use client';
import { useState } from 'react';
import { runCommand } from '@/lib/hub/cmd';

export function CommandBar() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<Record<string, unknown> | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResp(null);
    try {
      const r = await runCommand(q);
      setResp(r as Record<string, unknown>);
    } catch (error) {
      setResp({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
      setQ('');
    }
  }

  return (
    <div className="w-[560px]">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask: Show weekly MRR vs burn, Create SaaS project, Pull SFDC opps..."
          className="flex-1 rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button
          className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={loading || !q.trim()}
        >
          {loading ? 'Running...' : 'Run'}
        </button>
      </form>
      {resp && (
        <div className="mt-2 text-xs text-neutral-300 bg-neutral-800 rounded p-2 max-h-48 overflow-y-auto">
          <pre className="whitespace-pre-wrap">{JSON.stringify(resp, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

