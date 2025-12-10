'use client';
import { useState, useRef, useEffect } from 'react';
import { runCommand } from '@/lib/hub/cmd';
import { CommandResult, VisualizationSpec, KPI } from '@/lib/hub/types';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/hub/format';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  X,
  History,
  Lightbulb
} from 'lucide-react';

type CommandHistoryItem = {
  input: string;
  result: CommandResult;
  timestamp: Date;
};

export function CommandBar() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<CommandResult | null>(null);
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigate history with arrow keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' && history.length > 0) {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      setQ(history[newIndex].input);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      if (newIndex < 0) {
        setHistoryIndex(-1);
        setQ('');
      } else {
        setHistoryIndex(newIndex);
        setQ(history[newIndex].input);
      }
    } else if (e.key === 'Escape') {
      setResp(null);
      setShowHistory(false);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    
    setLoading(true);
    setResp(null);
    setHistoryIndex(-1);
    
    try {
      const r = await runCommand(q);
      setResp(r);
      setHistory(prev => [{ input: q, result: r, timestamp: new Date() }, ...prev.slice(0, 19)]);
    } catch (error) {
      const errorResult: CommandResult = { 
        intent: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      setResp(errorResult);
    } finally {
      setLoading(false);
      setQ('');
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQ(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Command Input */}
      <form onSubmit={onSubmit} className="relative">
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-indigo-600 transition-all">
          <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowHistory(history.length > 0 && !q)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            placeholder="Ask Copilot: Show MRR vs burn, Create project, Pull SFDC opps..."
            className="flex-1 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-neutral-500 bg-neutral-800 rounded">
            ⌘K
          </kbd>
          <button
            type="submit"
            className="p-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading || !q.trim()}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Command History Dropdown */}
        {showHistory && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
            <div className="p-2 text-xs text-neutral-500 border-b border-neutral-800 flex items-center gap-1">
              <History className="w-3 h-3" /> Recent Commands
            </div>
            {history.slice(0, 5).map((item, i) => (
              <button
                key={i}
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
                onClick={() => {
                  setQ(item.input);
                  setShowHistory(false);
                }}
              >
                {item.input}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Response Panel */}
      {resp !== null && (
        <ResponsePanel 
          resp={resp} 
          onClose={() => setResp(null)} 
          onSuggestionClick={handleSuggestionClick}
        />
      )}
    </div>
  );
}

// Response panel extracted to its own component for better type inference
function ResponsePanel({ 
  resp, 
  onClose, 
  onSuggestionClick 
}: { 
  resp: CommandResult; 
  onClose: () => void;
  onSuggestionClick: (suggestion: string) => void;
}): React.ReactElement {
  const message: string = resp.message;
  const intent: string = resp.intent;
  const visualization = resp.visualization;
  const data = resp.data;
  const suggestions = resp.suggestions;
  
  return (
    <div className="mt-3 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium text-neutral-200">Copilot Response</span>
          <span className="text-xs px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-400">{intent}</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-neutral-800 rounded transition-colors"
        >
          <X className="w-4 h-4 text-neutral-500" />
        </button>
      </div>
      
      {/* Message */}
      <div className="px-4 py-3">
        <p className="text-sm text-neutral-200">{message}</p>
      </div>

      {/* Visualization */}
      {visualization ? (
        <div className="px-4 pb-3">
          <ResponseVisualization spec={visualization} />
        </div>
      ) : null}

      {/* Data Preview */}
      {data && !visualization ? (
        <div className="px-4 pb-3">
          <div className="bg-neutral-950 rounded p-3 max-h-48 overflow-y-auto">
            <pre className="text-xs text-neutral-400 whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 ? (
        <div className="px-4 pb-3 border-t border-neutral-800 pt-3">
          <div className="flex items-center gap-1 text-xs text-neutral-500 mb-2">
            <Lightbulb className="w-3 h-3" /> Try these commands
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(s)}
                className="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Component to render different visualization types
function ResponseVisualization({ spec }: { spec: VisualizationSpec }) {
  if (spec.type === 'kpi_cards') {
    const kpis = spec.data as KPI[];
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {kpis.slice(0, 8).map((kpi, i) => (
          <KPICard key={i} kpi={kpi} />
        ))}
      </div>
    );
  }

  if (spec.type === 'chart') {
    const chartData = spec.data as { 
      series?: { label: string; points: number[] }[];
      labels?: string[];
    };
    return (
      <div className="bg-neutral-950 rounded p-3">
        <div className="text-xs text-neutral-400 mb-2">{spec.title}</div>
        {chartData.series && (
          <div className="space-y-2">
            {chartData.series.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 w-12">{s.label}</span>
                <div className="flex-1 h-6 bg-neutral-800 rounded overflow-hidden flex items-end gap-px">
                  {s.points.map((p, j) => {
                    const max = Math.max(...s.points);
                    const height = (p / max) * 100;
                    return (
                      <div
                        key={j}
                        className="flex-1 bg-indigo-500 rounded-t transition-all"
                        style={{ height: `${height}%` }}
                        title={`${chartData.labels?.[j] || j}: ${formatNumber(p)}`}
                      />
                    );
                  })}
                </div>
                <span className="text-xs text-neutral-400 w-16 text-right">
                  {formatNumber(s.points[s.points.length - 1])}
                </span>
              </div>
            ))}
          </div>
        )}
        {chartData.labels && (
          <div className="flex justify-between mt-1 text-[10px] text-neutral-600">
            {chartData.labels.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (spec.type === 'table') {
    const tableData = spec.data as Record<string, unknown>[];
    if (!tableData || tableData.length === 0) return null;
    
    const headers = Object.keys(tableData[0]);
    return (
      <div className="bg-neutral-950 rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-neutral-800">
              {headers.map(h => (
                <th key={h} className="px-2 py-1.5 text-left text-neutral-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.slice(0, 5).map((row, i) => (
              <tr key={i} className="border-b border-neutral-800 last:border-0">
                {headers.map(h => (
                  <td key={h} className="px-2 py-1.5 text-neutral-300">{String(row[h])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}

// KPI Card component for metrics display
function KPICard({ kpi }: { kpi: KPI }) {
  const formatValue = (key: string, value: number) => {
    const k = key.toLowerCase();
    if (k.includes('mrr') || k.includes('arr') || k.includes('burn') || k.includes('pipeline') || k.includes('revenue')) {
      return formatCurrency(value);
    }
    if (k.includes('rate') || k.includes('utilization') || k.includes('percent')) {
      return formatPercent(value);
    }
    return formatNumber(value);
  };

  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const trendColor = kpi.trend === 'up' ? 'text-emerald-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-neutral-500';

  return (
    <div className="bg-neutral-950 rounded p-2">
      <div className="text-[10px] text-neutral-500 truncate">{kpi.key}</div>
      <div className="text-sm font-semibold text-neutral-200 mt-0.5">
        {formatValue(kpi.key, kpi.value)}
      </div>
      {kpi.trend && (
        <div className={`flex items-center gap-0.5 mt-0.5 ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          {kpi.change_percent !== undefined && (
            <span className="text-[10px]">{kpi.change_percent > 0 ? '+' : ''}{kpi.change_percent.toFixed(1)}%</span>
          )}
        </div>
      )}
    </div>
  );
}

