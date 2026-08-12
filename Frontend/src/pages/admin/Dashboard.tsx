import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getSummaryReport } from "../../api/reports";
import { listActivityLogs } from "../../api/core";
import { API_BASE_URL } from "../../api/client";
import { IconBookOpen, IconCurrencyDollar, IconLibrary, IconUsers } from "../../components/icons";
import Spinner from "../../components/ui/Spinner";
import StatCard from "../../components/ui/StatCard";
import { useAuth } from "../../context/AuthContext";

const DJANGO_ADMIN_URL = `${API_BASE_URL.replace(/\/api\/?$/, "")}/admin/`;

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useQuery({ queryKey: ["reports", "summary"], queryFn: getSummaryReport });
  const { data: logs } = useQuery({
    queryKey: ["activity-logs", "recent"],
    queryFn: () => listActivityLogs({ page_size: 6 }),
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Welcome, {user?.first_name || user?.username}</h1>
        <p className="page-subtitle">System-wide overview and administration.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Books" value={summary?.total_books ?? 0} icon={<IconLibrary />} tone="indigo" />
        <StatCard label="Total Students" value={summary?.total_students ?? 0} icon={<IconUsers />} tone="violet" />
        <StatCard label="Active Borrows" value={summary?.active_borrow_records ?? 0} icon={<IconBookOpen />} tone="sky" />
        <StatCard
          label="Outstanding Fines"
          value={`$${(summary?.outstanding_fines ?? 0).toFixed(2)}`}
          icon={<IconCurrencyDollar />}
          tone="red"
        />
      </div>

      <div className="glass-card p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Full System Management</h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          Users, librarians, students, books, categories, borrow requests/records, and fines are all manageable from
          the Advanced Settings panel.
        </p>
        <a
          href={DJANGO_ADMIN_URL}
          className="inline-flex w-fit items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Open Advanced Settings
        </a>
      </div>

      <div className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2>
          <Link to="/admin/activity-logs" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {logs?.results.map((log) => (
            <li key={log.id} className="py-2 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">{log.user_name}</span>{" "}
              <span className="text-slate-500 dark:text-slate-400">{log.action.replace(/_/g, " ")}</span>{" "}
              {log.description && <span className="text-slate-500 dark:text-slate-400">— {log.description}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
