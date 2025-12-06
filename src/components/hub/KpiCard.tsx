import { formatCurrency, formatNumber, formatPercent } from '@/lib/hub/format';

export function KpiCard({ title, value }: { title: string; value: number | string }) {
  const displayValue = typeof value === 'number' 
    ? (title.toLowerCase().includes('mrr') || title.toLowerCase().includes('burn') || title.toLowerCase().includes('budget') || title.toLowerCase().includes('revenue'))
      ? formatCurrency(value)
      : title.toLowerCase().includes('%') || title.toLowerCase().includes('percent')
      ? formatPercent(value)
      : formatNumber(value)
    : value;
    
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
      <div className="text-xs text-neutral-400 mb-1">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-neutral-100">{displayValue}</div>
    </div>
  );
}

