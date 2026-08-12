import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listActivityLogs } from "../../api/core";
import { Input } from "../../components/ui/Input";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import Table from "../../components/ui/Table";
import type { Column } from "../../components/ui/Table";
import type { ActivityLog } from "../../types";

const PAGE_SIZE = 15;

export default function ActivityLogs() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["activity-logs", search, page],
    queryFn: () => listActivityLogs({ search: search || undefined, page, page_size: PAGE_SIZE }),
  });

  const columns: Column<ActivityLog>[] = [
    { header: "Time", key: "timestamp", render: (l) => new Date(l.timestamp).toLocaleString() },
    { header: "User", key: "user_name" },
    { header: "Action", key: "action", render: (l) => l.action.replace(/_/g, " ") },
    { header: "Model", key: "model_name" },
    { header: "Details", key: "description" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="page-title">Activity Logs</h1>
      <Input
        placeholder="Search by user, action, or model"
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        className="max-w-sm"
      />
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <Table columns={columns} rows={data?.results ?? []} keyExtractor={(l) => l.id} />
          {data && <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
