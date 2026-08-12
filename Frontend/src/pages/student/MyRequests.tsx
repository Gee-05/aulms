import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { cancelBorrowRequest, listBorrowRequests } from "../../api/borrowing";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import StatusBadge from "../../components/ui/StatusBadge";
import Table from "../../components/ui/Table";
import type { Column } from "../../components/ui/Table";
import type { BorrowRequest } from "../../types";

const PAGE_SIZE = 10;

export default function MyRequests() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["borrow-requests", "mine", page],
    queryFn: () => listBorrowRequests({ page, page_size: PAGE_SIZE, ordering: "-request_date" }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelBorrowRequest(id),
    onSuccess: () => {
      toast.success("Request cancelled.");
      queryClient.invalidateQueries({ queryKey: ["borrow-requests"] });
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const columns: Column<BorrowRequest>[] = [
    { header: "Book", key: "book_title" },
    {
      header: "Status",
      key: "status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    { header: "Requested", key: "request_date", render: (r) => new Date(r.request_date).toLocaleDateString() },
    { header: "Due Date", key: "due_date", render: (r) => r.due_date ?? "-" },
    {
      header: "Actions",
      key: "actions",
      render: (r) =>
        r.status === "pending" ? (
          <Button
            variant="danger"
            className="px-2 py-1 text-xs"
            onClick={() => cancelMutation.mutate(r.id)}
            isLoading={cancelMutation.isPending}
          >
            Cancel
          </Button>
        ) : (
          <span className="text-xs text-slate-400">{r.rejection_reason}</span>
        ),
    },
  ];

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="page-title">My Borrow Requests</h1>
      <Table columns={columns} rows={data?.results ?? []} keyExtractor={(r) => r.id} />
      {data && <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPageChange={setPage} />}
    </div>
  );
}
