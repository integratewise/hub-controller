'use client';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/hub/format';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { MiniChart } from './Chart';
import { KPI } from '@/lib/hub/types';

interface KpiCardProps {
  title?: string;
  value?: number | string;
  kpi?: KPI;
  trend?: 'up' | 'down' | 'flat';
  changePercent?: number;
  sparklineData?: number[];
  subtitle?: string;
  onClick?: () => void;
}

export function KpiCard({ 
  title, 
  value, 
  kpi,
  trend,
  changePercent,
  sparklineData,
  subtitle,
  onClick,
}: KpiCardProps) {
  // Support both direct props and KPI object
  const displayTitle = title || kpi?.key || '';
  const displayValue = value ?? kpi?.value;
  const displayTrend = trend || kpi?.trend;
  const displayChange = changePercent ?? kpi?.change_percent;
  
  const formatValue = (key: string, val: number | string) => {
    if (typeof val === 'string') return val;
    const k = key.toLowerCase();
    if (k.includes('mrr') || k.includes('arr') || k.includes('burn') || k.includes('budget') || k.includes('revenue') || k.includes('pipeline') || k.includes('cac') || k.includes('ltv')) {
      return formatCurrency(val);
    }
    if (k.includes('rate') || k.includes('utilization') || k.includes('percent') || k.includes('churn') || k.includes('%')) {
      return formatPercent(val);
    }
    return formatNumber(val);
  };

  const TrendIcon = displayTrend === 'up' ? TrendingUp : displayTrend === 'down' ? TrendingDown : Minus;
  const trendColor = displayTrend === 'up' ? 'text-emerald-500' : displayTrend === 'down' ? 'text-red-500' : 'text-neutral-500';
  const trendBg = displayTrend === 'up' ? 'bg-emerald-500/10' : displayTrend === 'down' ? 'bg-red-500/10' : 'bg-neutral-500/10';
  
  const formattedValue = displayValue !== undefined ? formatValue(displayTitle, displayValue) : '—';

  return (
    <div
      className={`rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-all ${
        onClick ? 'cursor-pointer hover:border-neutral-700 hover:bg-neutral-800' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs text-neutral-500 truncate">{displayTitle}</div>
        {displayTrend && (
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${trendBg}`}>
            <TrendIcon className={`w-3 h-3 ${trendColor}`} />
            {displayChange !== undefined && (
              <span className={`text-[10px] font-medium ${trendColor}`}>
                {displayChange > 0 ? '+' : ''}{displayChange.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-2 text-2xl font-semibold text-neutral-100">{formattedValue}</div>

      {subtitle && (
        <div className="mt-1 text-xs text-neutral-500">{subtitle}</div>
      )}
      
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3 -mx-1">
          <MiniChart 
            data={sparklineData} 
            color={displayTrend === 'up' ? '#10b981' : displayTrend === 'down' ? '#ef4444' : '#6366f1'}
            height={32}
          />
        </div>
      )}
      
      {onClick && (
        <div className="mt-3 flex items-center gap-1 text-xs text-indigo-600">
          <span>View details</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}

// Compact KPI card for grids
interface CompactKpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'neutral';
}

export function CompactKpiCard({ title, value, icon, color = 'indigo' }: CompactKpiCardProps) {
  const colorClasses = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    neutral: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
  };
  
  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider opacity-75 truncate">{title}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

// KPI Row for inline display
interface KpiRowProps {
  items: { label: string; value: string | number }[];
}

export function KpiRow({ items }: KpiRowProps) {
  return (
    <div className="flex items-center gap-4 text-sm">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-neutral-500">{item.label}:</span>
          <span className="text-neutral-100 font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

