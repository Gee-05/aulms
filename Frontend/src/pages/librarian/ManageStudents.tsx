import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { deleteStudent, listStudents, updateStudent } from "../../api/auth";
import { listBooks } from "../../api/books";
import { issueBook } from "../../api/borrowing";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import StatusBadge from "../../components/ui/StatusBadge";
import Table from "../../components/ui/Table";
import type { Column } from "../../components/ui/Table";
import type { MembershipType, StudentProfile } from "../../types";

const PAGE_SIZE = 10;

export default function ManageStudents() {
  const [search, setSearch] = useState("");
  const [membershipFilter, setMembershipFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<StudentProfile | null>(null);
  const [issueTarget, setIssueTarget] = useState<StudentProfile | null>(null);
  const [bookSearch, setBookSearch] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["students", search, membershipFilter, page],
    queryFn: () =>
      listStudents({
        search: search || undefined,
        membership_type: membershipFilter || undefined,
        page,
        page_size: PAGE_SIZE,
      }),
  });

  const { data: bookOptions } = useQuery({
    queryKey: ["books", "issue-search", bookSearch],
    queryFn: () => listBooks({ search: bookSearch || undefined, status: "available", page_size: 10 }),
    enabled: !!issueTarget,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["students"] });
  }

  const toggleActiveMutation = useMutation({
    mutationFn: (student: StudentProfile) => updateStudent(student.id, { is_active_member: !student.is_active_member }),
    onSuccess: () => {
      toast.success("Student membership status updated.");
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const membershipTypeMutation = useMutation({
    mutationFn: ({ student, membership_type }: { student: StudentProfile; membership_type: MembershipType }) =>
      updateStudent(student.id, { membership_type }),
    onSuccess: () => {
      toast.success("Membership type updated.");
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteStudent(id),
    onSuccess: () => {
      toast.success("Student account deleted.");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const issueMutation = useMutation({
    mutationFn: () => issueBook(issueTarget!.user.id, selectedBookId!, dueDate || undefined),
    onSuccess: () => {
      toast.success(`Book issued to ${issueTarget?.user.first_name}.`);
      closeIssueModal();
      queryClient.invalidateQueries({ queryKey: ["borrow-records"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  function closeIssueModal() {
    setIssueTarget(null);
    setBookSearch("");
    setSelectedBookId(null);
    setDueDate("");
  }

  const columns: Column<StudentProfile>[] = [
    { header: "Student ID", key: "student_id" },
    { header: "Name", key: "name", render: (s) => `${s.user.first_name} ${s.user.last_name}`.trim() || s.user.username },
    { header: "Email", key: "email", render: (s) => s.user.email },
    {
      header: "Type",
      key: "membership_type",
      render: (s) => (
        <Select
          value={s.membership_type}
          onChange={(e) =>
            membershipTypeMutation.mutate({ student: s, membership_type: e.target.value as MembershipType })
          }
          className="w-28 py-1 text-xs"
        >
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="guest">Guest</option>
        </Select>
      ),
    },
    { header: "Member Since", key: "membership_date" },
    {
      header: "Status",
      key: "is_active_member",
      render: (s) => <StatusBadge status={s.is_active_member ? "active" : "inactive"} />,
    },
    {
      header: "Actions",
      key: "actions",
      render: (s) => (
        <div className="flex flex-wrap gap-2">
          <Button className="px-2 py-1 text-xs" onClick={() => setIssueTarget(s)}>
            Issue Book
          </Button>
          <Button
            variant="secondary"
            className="px-2 py-1 text-xs"
            onClick={() => toggleActiveMutation.mutate(s)}
            isLoading={toggleActiveMutation.isPending}
          >
            {s.is_active_member ? "Deactivate" : "Activate"}
          </Button>
          <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => setDeleteTarget(s)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="page-title">Manage Students</h1>
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search by name, student ID, or email"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="max-w-sm"
        />
        <Select
          className="w-44"
          value={membershipFilter}
          onChange={(e) => {
            setPage(1);
            setMembershipFilter(e.target.value);
          }}
        >
          <option value="">All member types</option>
          <option value="student">Students</option>
          <option value="faculty">Faculty</option>
          <option value="guest">Guests</option>
        </Select>
      </div>
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <Table columns={columns} rows={data?.results ?? []} keyExtractor={(s) => s.id} />
          {data && <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPageChange={setPage} />}
        </>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Student Account">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to permanently delete{" "}
          <strong>
            {deleteTarget?.user.first_name} {deleteTarget?.user.last_name}
          </strong>
          's account?
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

      <Modal isOpen={!!issueTarget} onClose={closeIssueModal} title={`Issue Book to ${issueTarget?.user.first_name ?? ""}`}>
        <div className="flex flex-col gap-3">
          <Input
            label="Search available books"
            value={bookSearch}
            onChange={(e) => {
              setBookSearch(e.target.value);
              setSelectedBookId(null);
            }}
            placeholder="Title, author, or ISBN"
          />
          <div className="max-h-48 overflow-y-auto rounded-md ring-1 ring-slate-200 dark:ring-slate-700">
            {bookOptions?.results.length === 0 && (
              <p className="p-3 text-sm text-slate-500 dark:text-slate-400">No available books match.</p>
            )}
            {bookOptions?.results.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => setSelectedBookId(book.id)}
                className={`block w-full px-3 py-2 text-left text-sm ${
                  selectedBookId === book.id
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {book.title} <span className="opacity-70">— {book.author}</span>
              </button>
            ))}
          </div>
          <Input
            label="Due date (optional, defaults to member's standard loan period)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={closeIssueModal}>
              Cancel
            </Button>
            <Button
              onClick={() => issueMutation.mutate()}
              isLoading={issueMutation.isPending}
              disabled={!selectedBookId}
            >
              Issue Book
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
