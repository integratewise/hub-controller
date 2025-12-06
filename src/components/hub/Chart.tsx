export function Chart({ title, series }: { title: string; series: { label: string; points: number[] }[] }) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
      <div className="text-sm font-medium text-neutral-100 mb-2">{title}</div>
      <div className="text-xs text-neutral-400 mt-1 mb-4">
        (Placeholder) Connect your chart library (Recharts, Chart.js, or ECharts)
      </div>
      <div className="space-y-2">
        {series.map((s, i) => (
          <div key={i} className="text-xs text-neutral-300">
            <div className="font-medium">{s.label}</div>
            <div className="text-neutral-500">[{s.points.join(', ')}]</div>
          </div>
        ))}
      </div>
    </div>
  );
}

