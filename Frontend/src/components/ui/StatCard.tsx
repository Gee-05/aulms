import type { ReactNode } from "react";

type Tone = "indigo" | "emerald" | "sky" | "amber" | "red" | "violet" | "slate";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: Tone;
}

const TONE_STYLES: Record<Tone, string> = {
  indigo: "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
  sky: "bg-sky-500/15 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300",
  amber: "bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
  red: "bg-red-500/15 text-red-600 dark:bg-red-400/15 dark:text-red-300",
  violet: "bg-violet-500/15 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  slate: "bg-slate-500/15 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
};

export default function StatCard({ label, value, hint, icon, tone = "indigo" }: StatCardProps) {
  return (
    <div className="glass-card flex items-center gap-4 p-5">
      {icon && (
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl ${TONE_STYLES[tone]}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}
