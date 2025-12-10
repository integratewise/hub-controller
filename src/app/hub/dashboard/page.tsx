'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/hub/api';
import { KpiCard } from '@/components/hub/KpiCard';
import { Chart } from '@/components/hub/Chart';
import { Section, CardSection } from '@/components/hub/Section';
import { KPI } from '@/lib/hub/types';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  Activity,
  Calendar,
  RefreshCw
} from 'lucide-react';

// Sample data - replace with API calls
const financeKPIs: KPI[] = [
  { key: 'MRR', value: 125000, trend: 'up', change_percent: 8.5 },
  { key: 'ARR', value: 1500000, trend: 'up', change_percent: 12.3 },
  { key: 'Monthly Burn', value: 82000, trend: 'down', change_percent: -5.2 },
  { key: 'Runway (months)', value: 14, trend: 'up', change_percent: 16.7 },
  { key: 'Gross Margin', value: 72, trend: 'up', change_percent: 2.1 },
  { key: 'Net Revenue Retention', value: 118, trend: 'up', change_percent: 4.5 },
  { key: 'CAC', value: 850, trend: 'down', change_percent: -8.3 },
  { key: 'LTV', value: 12500, trend: 'up', change_percent: 6.2 },
];

const salesKPIs: KPI[] = [
  { key: 'Pipeline Value', value: 480000, trend: 'up', change_percent: 22.1 },
  { key: 'Win Rate', value: 28, trend: 'up', change_percent: 3.5 },
  { key: 'Avg Deal Size', value: 18500, trend: 'up', change_percent: 12.4 },
  { key: 'Sales Cycle (days)', value: 45, trend: 'down', change_percent: -8.2 },
];

const teamKPIs: KPI[] = [
  { key: 'Team Utilization', value: 78, trend: 'up', change_percent: 4.2 },
  { key: 'Billable Hours', value: 1250, trend: 'up', change_percent: 6.8 },
  { key: 'Headcount', value: 24, trend: 'flat', change_percent: 0 },
  { key: 'Avg Tenure (months)', value: 18, trend: 'up', change_percent: 8.3 },
];

const customerKPIs: KPI[] = [
  { key: 'Active Customers', value: 156, trend: 'up', change_percent: 15.2 },
  { key: 'Churn Rate', value: 2.1, trend: 'down', change_percent: -0.4 },
  { key: 'NPS Score', value: 72, trend: 'up', change_percent: 5.9 },
  { key: 'CSAT', value: 4.6, trend: 'up', change_percent: 2.2 },
];

const mrrTrend = {
  labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [
    { label: 'MRR', points: [95000, 102000, 108000, 115000, 120000, 125000] },
    { label: 'Burn', points: [95000, 92000, 88000, 85000, 83000, 82000] },
  ],
};

const pipelineTrend = {
  labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [
    { label: 'Pipeline', points: [280000, 320000, 380000, 420000, 450000, 480000] },
    { label: 'Closed Won', points: [45000, 52000, 68000, 72000, 85000, 92000] },
  ],
};

const revenueMix = {
  labels: ['SaaS', 'Services', 'Support', 'Training'],
  series: [
    { label: 'Revenue', points: [65, 22, 8, 5] },
  ],
};

const cashFlow = {
  labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [
    { label: 'Inflow', points: [95000, 105000, 115000, 125000, 130000, 140000] },
    { label: 'Outflow', points: [88000, 92000, 95000, 90000, 85000, 82000] },
  ],
};

export default function MetricsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Metrics Dashboard</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Executive overview of all key performance indicators
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  period === p
                    ? 'bg-indigo-600 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-300 hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Calendar className="w-3 h-3" />
        Last updated: {lastUpdated.toLocaleString()}
      </div>

      {/* Finance Section */}
      <Section title="Financial Health" description="Revenue, costs, and runway metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {financeKPIs.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Chart 
            title="MRR vs Burn Rate" 
            series={mrrTrend.series} 
            labels={mrrTrend.labels}
            type="area"
            isCurrency
            height={250}
          />
          <Chart 
            title="Cash Flow" 
            series={cashFlow.series} 
            labels={cashFlow.labels}
            type="bar"
            isCurrency
            height={250}
          />
        </div>
      </Section>

      {/* Sales Section */}
      <Section title="Sales Performance" description="Pipeline, deals, and conversion metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {salesKPIs.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Chart 
            title="Pipeline & Closed Won" 
            series={pipelineTrend.series} 
            labels={pipelineTrend.labels}
            type="area"
            isCurrency
            height={250}
          />
          <Chart 
            title="Revenue Mix" 
            series={revenueMix.series} 
            labels={revenueMix.labels}
            type="pie"
            height={250}
          />
        </div>
      </Section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Metrics */}
        <Section title="Team & Operations">
          <div className="grid grid-cols-2 gap-4">
            {teamKPIs.map((kpi) => (
              <KpiCard key={kpi.key} kpi={kpi} />
            ))}
          </div>
        </Section>

        {/* Customer Metrics */}
        <Section title="Customer Success">
          <div className="grid grid-cols-2 gap-4">
            {customerKPIs.map((kpi) => (
              <KpiCard key={kpi.key} kpi={kpi} />
            ))}
          </div>
        </Section>
      </div>

      {/* Unit Economics */}
      <Section title="Unit Economics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CardSection title="LTV:CAC Ratio">
            <div className="text-3xl font-bold text-emerald-400">14.7x</div>
            <div className="text-xs text-neutral-500 mt-1">Target: &gt;3x</div>
          </CardSection>
          <CardSection title="Payback Period">
            <div className="text-3xl font-bold text-indigo-400">6.8 mo</div>
            <div className="text-xs text-neutral-500 mt-1">Target: &lt;12 mo</div>
          </CardSection>
          <CardSection title="Magic Number">
            <div className="text-3xl font-bold text-amber-400">1.2</div>
            <div className="text-xs text-neutral-500 mt-1">Target: &gt;0.75</div>
          </CardSection>
          <CardSection title="Rule of 40">
            <div className="text-3xl font-bold text-purple-400">48%</div>
            <div className="text-xs text-neutral-500 mt-1">Growth + Margin</div>
          </CardSection>
        </div>
      </Section>

      {/* Benchmarks */}
      <Section title="Industry Benchmarks">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'MRR Growth', yours: '8.5%', benchmark: '5-10%', status: 'good' },
              { label: 'Gross Margin', yours: '72%', benchmark: '70-80%', status: 'good' },
              { label: 'Churn Rate', yours: '2.1%', benchmark: '<3%', status: 'good' },
              { label: 'NRR', yours: '118%', benchmark: '>100%', status: 'excellent' },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-xs text-neutral-500 mb-1">{item.label}</div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-lg font-semibold ${
                    item.status === 'excellent' ? 'text-emerald-400' :
                    item.status === 'good' ? 'text-indigo-400' : 'text-amber-400'
                  }`}>
                    {item.yours}
                  </span>
                  <span className="text-xs text-neutral-500">vs {item.benchmark}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}

