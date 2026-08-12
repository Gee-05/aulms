import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listBorrowRecords } from "../../api/borrowing";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import StatusBadge from "../../components/ui/StatusBadge";
import Table from "../../components/ui/Table";
import type { Column } from "../../components/ui/Table";
import type { BorrowRecord } from "../../types";

const PAGE_SIZE = 10;

export default function BorrowHistory() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["borrow-records", "history", page],
    queryFn: () => listBorrowRecords({ page, page_size: PAGE_SIZE, ordering: "-created_at" }),
  });

  const columns: Column<BorrowRecord>[] = [
    { header: "Book", key: "book_title" },
    { header: "Borrowed", key: "borrow_date" },
    { header: "Due Date", key: "due_date" },
    { header: "Returned", key: "return_date", render: (r) => r.return_date ?? "-" },
    { header: "Status", key: "status", render: (r) => <StatusBadge status={r.status} /> },
    {
      header: "Fines",
      key: "fines",
      render: (r) =>
        r.fines.length ? (
          <span>${r.fines.reduce((sum, f) => sum + Number(f.amount), 0).toFixed(2)}</span>
        ) : (
          "-"
        ),
    },
  ];

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="page-title">Borrowing History</h1>
      <Table columns={columns} rows={data?.results ?? []} keyExtractor={(r) => r.id} />
      {data && <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPageChange={setPage} />}
    </div>
  );
}
