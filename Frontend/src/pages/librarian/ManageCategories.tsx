import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "react-toastify";
import { createCategory, deleteCategory, listCategories, updateCategory } from "../../api/books";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Spinner from "../../components/ui/Spinner";
import Table from "../../components/ui/Table";
import type { Column } from "../../components/ui/Table";
import type { Category } from "../../types";

export default function ManageCategories() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["categories", "manage"], queryFn: () => listCategories() });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "" });
    setShowForm(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({ name: category.name, description: category.description });
    setShowForm(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => (editing ? updateCategory(editing.id, form) : createCategory(form)),
    onSuccess: () => {
      toast.success(editing ? "Category updated." : "Category created.");
      setShowForm(false);
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted.");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  const columns: Column<Category>[] = [
    { header: "Name", key: "name" },
    { header: "Description", key: "description", render: (c) => c.description || "-" },
    { header: "Books", key: "book_count" },
    {
      header: "Actions",
      key: "actions",
      render: (c) => (
        <div className="flex gap-2">
          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => openEdit(c)}>
            Edit
          </Button>
          <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => setDeleteTarget(c)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Manage Categories</h1>
        <Button onClick={openCreate}>+ Add Category</Button>
      </div>

      <Table columns={columns} rows={data?.results ?? []} keyExtractor={(c) => c.id} />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? "Edit Category" : "Add Category"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            id="name"
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Textarea
            id="description"
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              {editing ? "Save changes" : "Create category"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Category">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
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
