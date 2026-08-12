import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getSummaryReport } from "../../api/reports";
import { listBorrowRequests } from "../../api/borrowing";
import {
  IconAlertClock,
  IconBookOpen,
  IconBookmark,
  IconCheck,
  IconCurrencyDollar,
  IconHourglass,
  IconLibrary,
  IconXCircle,
} from "../../components/icons";
import Spinner from "../../components/ui/Spinner";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { useAuth } from "../../context/AuthContext";

export default function LibrarianDashboard() {
  const { user } = useAuth();

  const { data: summary, isLoading } = useQuery({ queryKey: ["reports", "summary"], queryFn: getSummaryReport });
  const { data: pending } = useQuery({
    queryKey: ["borrow-requests", "pending-queue"],
    queryFn: () => listBorrowRequests({ status: "pending", page_size: 5, ordering: "request_date" }),
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Welcome, {user?.first_name || user?.username}</h1>
        <p className="page-subtitle">Library operations at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Books" value={summary?.total_books ?? 0} icon={<IconLibrary />} tone="indigo" />
        <StatCard label="Available" value={summary?.available_books ?? 0} icon={<IconCheck />} tone="emerald" />
        <StatCard label="Borrowed" value={summary?.borrowed_books ?? 0} icon={<IconBookOpen />} tone="sky" />
        <StatCard label="Overdue" value={summary?.overdue_books ?? 0} icon={<IconAlertClock />} tone="red" />
        <StatCard label="Pending Requests" value={summary?.pending_requests ?? 0} icon={<IconHourglass />} tone="amber" />
        <StatCard label="Reserved" value={summary?.reserved_books ?? 0} icon={<IconBookmark />} tone="violet" />
        <StatCard label="Lost Books" value={summary?.lost_books ?? 0} icon={<IconXCircle />} tone="slate" />
        <StatCard
          label="Outstanding Fines"
          value={`$${(summary?.outstanding_fines ?? 0).toFixed(2)}`}
          icon={<IconCurrencyDollar />}
          tone="red"
        />
      </div>

      <div className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Pending Borrow Requests</h2>
          <Link to="/librarian/requests" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            View all
          </Link>
        </div>
        {pending?.results.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No pending requests right now.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {pending?.results.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{r.book_title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Requested by {r.student_name}</p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
