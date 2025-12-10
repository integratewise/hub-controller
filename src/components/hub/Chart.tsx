'use client';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/hub/format';

// Color palette for charts
const COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

type ChartType = 'line' | 'area' | 'bar' | 'stacked-bar' | 'pie';

interface ChartProps {
  title: string;
  series: { label: string; points: number[] }[];
  labels?: string[];
  type?: ChartType;
  height?: number;
  isCurrency?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
}

// Transform series data into Recharts format
function transformData(series: { label: string; points: number[] }[], labels?: string[]) {
  const maxLength = Math.max(...series.map(s => s.points.length));
  const data = [];
  
  for (let i = 0; i < maxLength; i++) {
    const item: Record<string, unknown> = {
      name: labels?.[i] || `${i + 1}`,
    };
    series.forEach(s => {
      item[s.label] = s.points[i] ?? 0;
    });
    data.push(item);
  }
  return data;
}

// Custom tooltip component
function CustomTooltip({ 
  active, 
  payload, 
  label, 
  isCurrency 
}: { 
  active?: boolean; 
  payload?: { color: string; name: string; value: number }[]; 
  label?: string; 
  isCurrency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-2 shadow-xl">
      <div className="text-xs text-neutral-400 mb-1">{label}</div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-neutral-300">{entry.name}:</span>
          <span className="text-neutral-100 font-medium">
            {isCurrency ? formatCurrency(entry.value) : formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Chart({ 
  title, 
  series, 
  labels,
  type = 'line', 
  height = 200,
  isCurrency = false,
  showLegend = true,
  stacked = false,
}: ChartProps) {
  const data = transformData(series, labels);
  const formatValue = (value: number) => isCurrency ? formatCurrency(value, true) : formatNumber(value);

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={i} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
              width={60}
            />
            <Tooltip content={<CustomTooltip isCurrency={isCurrency} />} />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />}
            {series.map((s, i) => (
              <Area
                key={i}
                type="monotone"
                dataKey={s.label}
                stroke={COLORS[i % COLORS.length]}
                fill={`url(#gradient-${i})`}
                strokeWidth={2}
                stackId={stacked ? '1' : undefined}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
      case 'stacked-bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
              width={60}
            />
            <Tooltip content={<CustomTooltip isCurrency={isCurrency} />} />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />}
            {series.map((s, i) => (
              <Bar
                key={i}
                dataKey={s.label}
                fill={COLORS[i % COLORS.length]}
                stackId={type === 'stacked-bar' ? '1' : undefined}
                radius={type === 'stacked-bar' ? 0 : [4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        // For pie charts, use the first series
        const pieData = series[0]?.points.map((value, i) => ({
          name: labels?.[i] || `Item ${i + 1}`,
          value,
        })) || [];
        
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip isCurrency={isCurrency} />} />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
          </PieChart>
        );

      case 'line':
      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
              width={60}
            />
            <Tooltip content={<CustomTooltip isCurrency={isCurrency} />} />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />}
            {series.map((s, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={s.label}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: COLORS[i % COLORS.length], strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="text-sm font-medium text-neutral-100 mb-4">{title}</div>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

// Sparkline for inline metrics
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function Sparkline({ data, color = '#6366f1', height = 24, width = 80 }: SparklineProps) {
  const chartData = data.map((value, i) => ({ value, idx: i }));
  
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Mini chart for KPI cards
interface MiniChartProps {
  data: number[];
  type?: 'line' | 'bar';
  color?: string;
  height?: number;
}

export function MiniChart({ data, type = 'line', color = '#6366f1', height = 40 }: MiniChartProps) {
  const chartData = data.map((value, i) => ({ value, idx: i }));
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'bar' ? (
        <BarChart data={chartData}>
          <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      ) : (
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill="url(#miniGradient)"
            strokeWidth={1.5}
          />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}

