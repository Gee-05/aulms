import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  approveRenewal,
  listBorrowRecords,
  markLost,
  rejectRenewal,
  returnBook,
} from "../../api/borrowing";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import StatusBadge from "../../components/ui/StatusBadge";
import Table from "../../components/ui/Table";
import type { Column } from "../../components/ui/Table";
import type { BorrowRecord } from "../../types";

export default function ReturnsAndRenewals() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["borrow-records", "active-management"],
    queryFn: () => listBorrowRecords({ page_size: 200, ordering: "due_date" }),
    select: (res) => res.results.filter((r) => r.status === "borrowed" || r.status === "overdue"),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["borrow-records"] });
    queryClient.invalidateQueries({ queryKey: ["books"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });
  }

  const returnMutation = useMutation({
    mutationFn: (id: number) => returnBook(id),
    onSuccess: () => {
      toast.success("Book return confirmed.");
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const lostMutation = useMutation({
    mutationFn: (id: number) => markLost(id),
    onSuccess: () => {
      toast.success("Book marked as lost.");
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const approveRenewalMutation = useMutation({
    mutationFn: (id: number) => approveRenewal(id),
    onSuccess: () => {
      toast.success("Renewal approved.");
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const rejectRenewalMutation = useMutation({
    mutationFn: (id: number) => rejectRenewal(id),
    onSuccess: () => {
      toast.success("Renewal rejected.");
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const activeColumns: Column<BorrowRecord>[] = [
    { header: "Student", key: "student_name" },
    { header: "Book", key: "book_title" },
    { header: "Due Date", key: "due_date" },
    { header: "Status", key: "status", render: (r) => <StatusBadge status={r.status} /> },
    {
      header: "Actions",
      key: "actions",
      render: (r) => (
        <div className="flex gap-2">
          <Button className="px-2 py-1 text-xs" onClick={() => returnMutation.mutate(r.id)} isLoading={returnMutation.isPending}>
            Confirm Return
          </Button>
          <Button
            variant="secondary"
            className="px-2 py-1 text-xs"
            onClick={() => lostMutation.mutate(r.id)}
            isLoading={lostMutation.isPending}
          >
            Mark Lost
          </Button>
        </div>
      ),
    },
  ];

  const renewalRows = (data ?? []).filter((r) => r.renewal_requested);

  const renewalColumns: Column<BorrowRecord>[] = [
    { header: "Student", key: "student_name" },
    { header: "Book", key: "book_title" },
    { header: "Current Due Date", key: "due_date" },
    { header: "Renewals Used", key: "renewal_count" },
    {
      header: "Actions",
      key: "actions",
      render: (r) => (
        <div className="flex gap-2">
          <Button
            className="px-2 py-1 text-xs"
            onClick={() => approveRenewalMutation.mutate(r.id)}
            isLoading={approveRenewalMutation.isPending}
          >
            Approve
          </Button>
          <Button
            variant="danger"
            className="px-2 py-1 text-xs"
            onClick={() => rejectRenewalMutation.mutate(r.id)}
            isLoading={rejectRenewalMutation.isPending}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="page-title mb-4">Pending Renewal Requests</h1>
        <Table columns={renewalColumns} rows={renewalRows} keyExtractor={(r) => r.id} emptyMessage="No pending renewals." />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">Active Borrowed Books</h2>
        <Table columns={activeColumns} rows={data ?? []} keyExtractor={(r) => r.id} emptyMessage="No active borrows." />
      </div>
    </div>
  );
}
