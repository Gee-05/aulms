import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CSSProperties, ReactNode } from "react";

interface BarChartCardProps {
  title: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  actions?: ReactNode;
}

const SEQUENTIAL_BLUE = "var(--chart-series-1)";

export default function BarChartCard({ title, data, xKey, yKey, actions }: BarChartCardProps) {
  return (
    <div
      className="glass-card p-5"
      style={
        {
          "--chart-series-1": "#2a78d6",
        } as CSSProperties
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {actions}
      </div>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">No data available yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12 }}
              className="fill-slate-500 dark:fill-slate-400"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-slate-500 dark:fill-slate-400"
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 13, border: "1px solid #e2e8f0" }}
              cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
            />
            <Bar dataKey={yKey} fill={SEQUENTIAL_BLUE} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
