import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { deleteUser, listAllUsers, setUserActive } from "../../api/auth";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import StatusBadge from "../../components/ui/StatusBadge";
import Table from "../../components/ui/Table";
import type { Column } from "../../components/ui/Table";
import { useAuth } from "../../context/AuthContext";
import type { User } from "../../types";

const PAGE_SIZE = 10;

export default function ManageUsers() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["users", "manage", search, role, page],
    queryFn: () => listAllUsers({ search: search || undefined, role: role || undefined, page, page_size: PAGE_SIZE }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  }

  const toggleActiveMutation = useMutation({
    mutationFn: (target: User) => setUserActive(target.id, !target.is_active),
    onSuccess: (_, target) => {
      toast.success(target.is_active ? "Account suspended." : "Account reactivated.");
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      toast.success("Account deleted.");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const columns: Column<User>[] = [
    { header: "Username", key: "username" },
    { header: "Name", key: "name", render: (u) => `${u.first_name} ${u.last_name}`.trim() || "-" },
    { header: "Email", key: "email" },
    { header: "Role", key: "role", render: (u) => <StatusBadge status={u.role} /> },
    {
      header: "Status",
      key: "is_active",
      render: (u) => <StatusBadge status={u.is_active ? "active" : "suspended"} />,
    },
    {
      header: "Actions",
      key: "actions",
      render: (u) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="px-2 py-1 text-xs"
            onClick={() => toggleActiveMutation.mutate(u)}
            isLoading={toggleActiveMutation.isPending}
            disabled={u.id === me?.id}
          >
            {u.is_active ? "Suspend" : "Reactivate"}
          </Button>
          <Button
            variant="danger"
            className="px-2 py-1 text-xs"
            onClick={() => setDeleteTarget(u)}
            disabled={u.id === me?.id}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="page-title">Manage Users</h1>

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search by name, username, or email"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="max-w-sm"
        />
        <Select
          className="w-44"
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
        >
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="librarian">Librarians</option>
          <option value="admin">Administrators</option>
        </Select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <Table columns={columns} rows={data?.results ?? []} keyExtractor={(u) => u.id} />
          {data && <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPageChange={setPage} />}
        </>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Account">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to permanently delete <strong>{deleteTarget?.username}</strong>'s account? This
          cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate(deleteTarget!.id)} isLoading={deleteMutation.isPending}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
