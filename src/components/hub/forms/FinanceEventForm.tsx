'use client';
import { useState } from 'react';
import { api } from '@/lib/hub/api';

export function FinanceEventForm({ onCreated }: { onCreated?: () => void }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Operations');
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!description.trim() || !amount.trim()) return;
    setLoading(true);
    try {
      await api.post('/finance/events', {
        description,
        amount: parseFloat(amount),
        type,
        category,
      });
      setDescription('');
      setAmount('');
      onCreated?.();
    } catch (error) {
      console.error('Failed to create finance event:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        className="rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        className="rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 w-32"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <select
        className="rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="expense">Expense</option>
        <option value="revenue">Revenue</option>
      </select>
      <select
        className="rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option>Operations</option>
        <option>Sales</option>
        <option>Marketing</option>
        <option>R&D</option>
        <option>Other</option>
      </select>
      <button
        className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        onClick={create}
        disabled={loading || !description.trim() || !amount.trim()}
      >
        {loading ? 'Creating...' : 'Add'}
      </button>
    </div>
  );
}

