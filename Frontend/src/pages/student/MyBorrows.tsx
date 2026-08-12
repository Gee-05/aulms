import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { listBorrowRecords, requestRenewal } from "../../api/borrowing";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import StatusBadge from "../../components/ui/StatusBadge";
import Table from "../../components/ui/Table";
import type { Column } from "../../components/ui/Table";
import type { BorrowRecord } from "../../types";

const PAGE_SIZE = 10;

export default function MyBorrows() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: allActive, isLoading } = useQuery({
    queryKey: ["borrow-records", "active-list"],
    queryFn: () => listBorrowRecords({ page_size: 200, ordering: "due_date" }),
    select: (res) => res.results.filter((r) => r.status === "borrowed" || r.status === "overdue"),
  });

  const total = allActive?.length ?? 0;
  const pageResults = (allActive ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const renewalMutation = useMutation({
    mutationFn: (id: number) => requestRenewal(id),
    onSuccess: () => {
      toast.success("Renewal requested. Awaiting librarian approval.");
      queryClient.invalidateQueries({ queryKey: ["borrow-records"] });
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const columns: Column<BorrowRecord>[] = [
    { header: "Book", key: "book_title" },
    { header: "Borrowed", key: "borrow_date" },
    { header: "Due Date", key: "due_date" },
    { header: "Status", key: "status", render: (r) => <StatusBadge status={r.status} /> },
    {
      header: "Renewal",
      key: "renewal_status",
      render: (r) =>
        r.renewal_requested ? (
          <StatusBadge status={r.renewal_status || "pending"} />
        ) : r.renewal_count > 0 ? (
          <span className="text-xs text-slate-400">Renewed {r.renewal_count}x</span>
        ) : (
          "-"
        ),
    },
    {
      header: "Actions",
      key: "actions",
      render: (r) => (
        <Button
          variant="secondary"
          className="px-2 py-1 text-xs"
          disabled={r.renewal_requested}
          onClick={() => renewalMutation.mutate(r.id)}
          isLoading={renewalMutation.isPending}
        >
          Request Renewal
        </Button>
      ),
    },
  ];

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="page-title">My Borrowed Books</h1>
      <Table columns={columns} rows={pageResults} keyExtractor={(r) => r.id} emptyMessage="You have no active borrows." />
      <Pagination page={page} pageSize={PAGE_SIZE} count={total} onPageChange={setPage} />
    </div>
  );
}
