import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  downloadReport,
  getFineReport,
  getMonthlyStats,
  getMostBorrowedReport,
  getOverdueReport,
  getStudentActivityReport,
  getSummaryReport,
} from "../api/reports";
import type { OverdueEntry } from "../api/reports";
import { extractErrorMessage } from "../api/client";
import BarChartCard from "../components/charts/BarChartCard";
import {
  IconAlertClock,
  IconBookOpen,
  IconBookmark,
  IconCheck,
  IconCurrencyDollar,
  IconLibrary,
  IconUsers,
  IconXCircle,
} from "../components/icons";
import Button from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import Spinner from "../components/ui/Spinner";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import Table from "../components/ui/Table";
import type { Column } from "../components/ui/Table";

function ExportButtons({
  report,
  extraParams,
}: {
  report: Parameters<typeof downloadReport>[0];
  extraParams?: Record<string, string | number | undefined>;
}) {
  async function handleDownload(format: "pdf" | "xlsx") {
    try {
      await downloadReport(report, format, extraParams);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => handleDownload("pdf")}>
        Export PDF
      </Button>
      <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => handleDownload("xlsx")}>
        Export Excel
      </Button>
    </div>
  );
}

export default function Reports() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [activityFilter, setActivityFilter] = useState<"" | "active" | "inactive">("");
  const [finePaidFilter, setFinePaidFilter] = useState<"" | "true" | "false">("");

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: getSummaryReport,
  });
  const { data: monthly } = useQuery({
    queryKey: ["reports", "monthly", year],
    queryFn: () => getMonthlyStats(year),
  });
  const { data: mostBorrowed } = useQuery({
    queryKey: ["reports", "most-borrowed"],
    queryFn: () => getMostBorrowedReport(10),
  });
  const { data: studentActivity } = useQuery({
    queryKey: ["reports", "student-activity", activityFilter],
    queryFn: () => getStudentActivityReport(activityFilter || undefined),
  });
  const { data: fines } = useQuery({
    queryKey: ["reports", "fines", finePaidFilter],
    queryFn: () => getFineReport(finePaidFilter === "" ? undefined : finePaidFilter === "true"),
  });
  const { data: overdue } = useQuery({
    queryKey: ["reports", "overdue"],
    queryFn: getOverdueReport,
  });

  if (loadingSummary) return <Spinner />;

  const activityColumns: Column<{ student: string; student_id: string; total_borrows: number; activity: string }>[] = [
    { header: "Student", key: "student" },
    { header: "Student ID", key: "student_id" },
    { header: "Total Borrows", key: "total_borrows" },
    { header: "Activity", key: "activity", render: (r) => <StatusBadge status={r.activity} /> },
  ];

  const overdueColumns: Column<OverdueEntry>[] = [
    { header: "Student", key: "student" },
    { header: "Email", key: "email" },
    { header: "Book", key: "book" },
    { header: "Due Date", key: "due_date" },
    {
      header: "Days Overdue",
      key: "days_overdue",
      render: (r) => <span className="font-semibold text-red-600 dark:text-red-400">{r.days_overdue}</span>,
    },
    { header: "Est. Fine", key: "estimated_fine", render: (r) => `$${r.estimated_fine.toFixed(2)}` },
  ];

  const fineColumns: Column<Record<string, unknown>>[] = [
    { header: "Student", key: "student" },
    { header: "Book", key: "book" },
    { header: "Amount", key: "amount", render: (r) => `$${Number(r.amount).toFixed(2)}` },
    { header: "Status", key: "status", render: (r) => <StatusBadge status={String(r.status)} /> },
    { header: "Issued", key: "issued" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Reports</h1>
        <ExportButtons report="summary" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Books" value={summary?.total_books ?? 0} icon={<IconLibrary />} tone="indigo" />
        <StatCard label="Available" value={summary?.available_books ?? 0} icon={<IconCheck />} tone="emerald" />
        <StatCard label="Borrowed" value={summary?.borrowed_books ?? 0} icon={<IconBookOpen />} tone="sky" />
        <StatCard label="Overdue" value={summary?.overdue_books ?? 0} icon={<IconAlertClock />} tone="red" />
        <StatCard label="Reserved" value={summary?.reserved_books ?? 0} icon={<IconBookmark />} tone="violet" />
        <StatCard label="Lost" value={summary?.lost_books ?? 0} icon={<IconXCircle />} tone="slate" />
        <StatCard label="Active Students" value={summary?.total_students ?? 0} icon={<IconUsers />} tone="violet" />
        <StatCard
          label="Outstanding Fines"
          value={`$${(summary?.outstanding_fines ?? 0).toFixed(2)}`}
          icon={<IconCurrencyDollar />}
          tone="red"
        />
      </div>

      <div className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Overdue Books {overdue && overdue.length > 0 && `(${overdue.length})`}
          </h2>
          <ExportButtons report="overdue" />
        </div>
        <Table
          columns={overdueColumns}
          rows={overdue ?? []}
          keyExtractor={(r) => r.record}
          emptyMessage="Nothing overdue right now."
        />
      </div>

      <BarChartCard
        title={`Monthly Borrowing (${year})`}
        data={monthly ?? []}
        xKey="month"
        yKey="count"
        actions={
          <div className="flex items-center gap-2">
            <Select className="w-28" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <ExportButtons report="monthly" extraParams={{ year }} />
          </div>
        }
      />

      <BarChartCard
        title="Most Borrowed Books"
        data={mostBorrowed?.map((b) => ({ ...b, name: b.title })) ?? []}
        xKey="name"
        yKey="times_borrowed"
        actions={<ExportButtons report="most-borrowed" />}
      />

      <div className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Student Activity</h2>
          <div className="flex items-center gap-2">
            <Select
              className="w-40"
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as "" | "active" | "inactive")}
            >
              <option value="">All students</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </Select>
            <ExportButtons report="student-activity" extraParams={{ only: activityFilter || undefined }} />
          </div>
        </div>
        <Table columns={activityColumns} rows={studentActivity ?? []} keyExtractor={(r) => r.student_id} />
      </div>

      <div className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Fine Report</h2>
          <div className="flex items-center gap-2">
            <Select
              className="w-40"
              value={finePaidFilter}
              onChange={(e) => setFinePaidFilter(e.target.value as "" | "true" | "false")}
            >
              <option value="">All fines</option>
              <option value="false">Unpaid only</option>
              <option value="true">Paid only</option>
            </Select>
            <ExportButtons report="fines" extraParams={{ is_paid: finePaidFilter || undefined }} />
          </div>
        </div>
        <Table columns={fineColumns} rows={fines ?? []} keyExtractor={(r) => `${r.student}-${r.book}-${r.issued}`} />
      </div>
    </div>
  );
}
