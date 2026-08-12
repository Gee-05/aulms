import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { approveBorrowRequest, listBorrowRequests, rejectBorrowRequest } from "../../api/borrowing";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import StatusBadge from "../../components/ui/StatusBadge";
import Table from "../../components/ui/Table";
import type { Column } from "../../components/ui/Table";
import type { BorrowRequest } from "../../types";

const PAGE_SIZE = 10;

export default function ManageRequests() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [approveTarget, setApproveTarget] = useState<BorrowRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<BorrowRequest | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["borrow-requests", "manage", status, page],
    queryFn: () => listBorrowRequests({ status: status || undefined, page, page_size: PAGE_SIZE, ordering: "-request_date" }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["borrow-requests"] });
    queryClient.invalidateQueries({ queryKey: ["books"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });
  }

  const approveMutation = useMutation({
    mutationFn: () => approveBorrowRequest(approveTarget!.id, dueDate || undefined),
    onSuccess: () => {
      toast.success("Request approved.");
      setApproveTarget(null);
      setDueDate("");
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectBorrowRequest(rejectTarget!.id, reason || undefined),
    onSuccess: () => {
      toast.success("Request rejected.");
      setRejectTarget(null);
      setReason("");
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const columns: Column<BorrowRequest>[] = [
    { header: "Student", key: "student_name" },
    { header: "Book", key: "book_title" },
    { header: "Requested", key: "request_date", render: (r) => new Date(r.request_date).toLocaleString() },
    { header: "Status", key: "status", render: (r) => <StatusBadge status={r.status} /> },
    {
      header: "Actions",
      key: "actions",
      render: (r) =>
        r.status === "pending" ? (
          <div className="flex gap-2">
            <Button className="px-2 py-1 text-xs" onClick={() => setApproveTarget(r)}>
              Approve
            </Button>
            <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => setRejectTarget(r)}>
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">by {r.processed_by_name ?? "-"}</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Borrow Requests</h1>
        <Select
          className="w-48"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <Table columns={columns} rows={data?.results ?? []} keyExtractor={(r) => r.id} />
          {data && <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPageChange={setPage} />}
        </>
      )}

      <Modal isOpen={!!approveTarget} onClose={() => setApproveTarget(null)} title="Approve Borrow Request">
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          Approve <strong>{approveTarget?.book_title}</strong> for <strong>{approveTarget?.student_name}</strong>. Borrow
          date is set to today automatically.
        </p>
        <Input
          label="Due date (optional, defaults to standard loan period)"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setApproveTarget(null)}>
            Cancel
          </Button>
          <Button onClick={() => approveMutation.mutate()} isLoading={approveMutation.isPending}>
            Approve
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Borrow Request">
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          Reject <strong>{rejectTarget?.book_title}</strong> for <strong>{rejectTarget?.student_name}</strong>.
        </p>
        <Textarea label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRejectTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => rejectMutation.mutate()} isLoading={rejectMutation.isPending}>
            Reject
          </Button>
        </div>
      </Modal>
    </div>
  );
}
