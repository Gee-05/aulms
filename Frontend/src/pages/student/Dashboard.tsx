import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listBorrowRecords, listBorrowRequests, listFines } from "../../api/borrowing";
import { IconAlertClock, IconBookOpen, IconCurrencyDollar, IconHourglass } from "../../components/icons";
import Spinner from "../../components/ui/Spinner";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { useAuth } from "../../context/AuthContext";

export default function StudentDashboard() {
  const { user } = useAuth();

  const { data: borrowed, isLoading: loadingBorrowed } = useQuery({
    queryKey: ["borrow-records", "active"],
    queryFn: () => listBorrowRecords({ status: "borrowed", page_size: 5, ordering: "due_date" }),
  });
  const { data: overdue } = useQuery({
    queryKey: ["borrow-records", "overdue"],
    queryFn: () => listBorrowRecords({ status: "overdue", page_size: 100 }),
  });
  const { data: pendingRequests } = useQuery({
    queryKey: ["borrow-requests", "pending"],
    queryFn: () => listBorrowRequests({ status: "pending", page_size: 100 }),
  });
  const { data: fines } = useQuery({
    queryKey: ["fines", "unpaid"],
    queryFn: () => listFines({ is_paid: "false", page_size: 100 }),
  });

  if (loadingBorrowed) return <Spinner />;

  const outstandingFines = fines?.results.reduce((sum, f) => sum + Number(f.amount), 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Welcome back, {user?.first_name || user?.username}</h1>
        <p className="page-subtitle">Here's what's happening with your books.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Borrowed Books" value={borrowed?.count ?? 0} icon={<IconBookOpen />} tone="sky" />
        <StatCard label="Pending Requests" value={pendingRequests?.count ?? 0} icon={<IconHourglass />} tone="amber" />
        <StatCard label="Overdue Books" value={overdue?.count ?? 0} icon={<IconAlertClock />} tone="red" />
        <StatCard label="Outstanding Fines" value={`$${outstandingFines.toFixed(2)}`} icon={<IconCurrencyDollar />} tone="red" />
      </div>

      <div className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Currently Borrowed</h2>
          <Link to="/student/borrows" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            View all
          </Link>
        </div>
        {borrowed?.results.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">You have no books borrowed right now.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {borrowed?.results.map((record) => (
              <li key={record.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{record.book_title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Due {record.due_date}</p>
                </div>
                <StatusBadge status={record.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
