import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { listFines, payFine } from "../../api/borrowing";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import StatusBadge from "../../components/ui/StatusBadge";
import Table from "../../components/ui/Table";
import type { Column } from "../../components/ui/Table";
import type { Fine } from "../../types";

const PAGE_SIZE = 10;

export default function MyFines() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["fines", "mine", page],
    queryFn: () => listFines({ page, page_size: PAGE_SIZE, ordering: "-created_at" }),
  });

  const payMutation = useMutation({
    mutationFn: (id: number) => payFine(id),
    onSuccess: () => {
      toast.success("Fine paid. Thank you!");
      queryClient.invalidateQueries({ queryKey: ["fines"] });
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const columns: Column<Fine>[] = [
    { header: "Book", key: "book_title" },
    { header: "Amount", key: "amount", render: (f) => `$${Number(f.amount).toFixed(2)}` },
    { header: "Reason", key: "reason" },
    { header: "Status", key: "is_paid", render: (f) => <StatusBadge status={f.is_paid ? "paid" : "unpaid"} /> },
    { header: "Issued", key: "created_at", render: (f) => new Date(f.created_at).toLocaleDateString() },
    {
      header: "Actions",
      key: "actions",
      render: (f) =>
        f.is_paid ? (
          "-"
        ) : (
          <Button
            className="px-2 py-1 text-xs"
            onClick={() => payMutation.mutate(f.id)}
            isLoading={payMutation.isPending}
          >
            Pay Now
          </Button>
        ),
    },
  ];

  const totalUnpaid = data?.results.filter((f) => !f.is_paid).reduce((sum, f) => sum + Number(f.amount), 0) ?? 0;

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">My Fines</h1>
        <p className="text-sm font-medium text-red-600 dark:text-red-400">Outstanding: ${totalUnpaid.toFixed(2)}</p>
      </div>
      <Table columns={columns} rows={data?.results ?? []} keyExtractor={(f) => f.id} emptyMessage="No fines on your account." />
      {data && <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPageChange={setPage} />}
    </div>
  );
}
