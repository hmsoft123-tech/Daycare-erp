"use client";

interface GaugeChartProps {
  label: string;
  value: number;
  max?: number;
}

export function GaugeChart({ label, value, max = 100 }: GaugeChartProps) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 85 ? "#10b981" : pct >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
