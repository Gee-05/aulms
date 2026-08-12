import type { ReactNode } from "react";

export interface Column<T> {
  header: string;
  key: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
}

export default function Table<T>({ columns, rows, keyExtractor, emptyMessage = "No records found." }: TableProps<T>) {
  return (
    <div className="glass-card overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200/70 dark:divide-slate-700/70">
        <thead className="bg-white/40 dark:bg-slate-950/30">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/70">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={keyExtractor(row)} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-200 ${col.className ?? ""}`}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
