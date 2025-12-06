export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://hub-controller-api.connect-a1b.workers.dev/api';

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  get: (p: string): Promise<unknown> => request(p),
  post: (p: string, body: unknown): Promise<unknown> => request(p, { method: 'POST', body: JSON.stringify(body) }),
  put: (p: string, body: unknown): Promise<unknown> => request(p, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (p: string): Promise<unknown> => request(p, { method: 'DELETE' }),
};

