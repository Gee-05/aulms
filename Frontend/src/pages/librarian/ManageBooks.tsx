import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "react-toastify";
import { createBook, deleteBook, listBooks, listCategories, updateBook, uploadEbook } from "../../api/books";
import { extractErrorMessage } from "../../api/client";
import { IconDocument } from "../../components/icons";
import Button from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import StatusBadge from "../../components/ui/StatusBadge";
import Table from "../../components/ui/Table";
import type { Column } from "../../components/ui/Table";
import type { Book } from "../../types";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  isbn: "",
  title: "",
  author: "",
  category: "",
  description: "",
  publisher: "",
  publication_year: "",
  total_copies: "1",
  available_copies: "1",
  shelf_location: "",
};

export default function ManageBooks() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Book | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [ebookTarget, setEbookTarget] = useState<Book | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["books", "manage", search, page],
    queryFn: () => listBooks({ search: search || undefined, page, page_size: PAGE_SIZE }),
  });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["books"] });
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setCoverFile(null);
    setShowForm(true);
  }

  function openEdit(book: Book) {
    setEditing(book);
    setForm({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      category: book.category ? String(book.category) : "",
      description: book.description,
      publisher: book.publisher,
      publication_year: book.publication_year ? String(book.publication_year) : "",
      total_copies: String(book.total_copies),
      available_copies: String(book.available_copies),
      shelf_location: book.shelf_location,
    });
    setCoverFile(null);
    setShowForm(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== "") fd.append(key, value);
      });
      if (coverFile) fd.append("cover_image", coverFile);
      return editing ? updateBook(editing.id, fd) : createBook(fd);
    },
    onSuccess: () => {
      toast.success(editing ? "Book updated." : "Book created.");
      setShowForm(false);
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBook(id),
    onSuccess: () => {
      toast.success("Book deleted.");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const ebookMutation = useMutation({
    mutationFn: () => uploadEbook(ebookTarget!.id, ebookFile!),
    onSuccess: () => {
      toast.success("Ebook attached. Students can now read it online.");
      setEbookTarget(null);
      setEbookFile(null);
      invalidate();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  const columns: Column<Book>[] = [
    { header: "Title", key: "title" },
    { header: "Author", key: "author" },
    { header: "ISBN", key: "isbn" },
    { header: "Category", key: "category_name", render: (b) => b.category_name ?? "-" },
    { header: "Copies", key: "copies", render: (b) => `${b.available_copies}/${b.total_copies}` },
    { header: "Status", key: "status", render: (b) => <StatusBadge status={b.status} /> },
    {
      header: "Ebook",
      key: "has_ebook",
      render: (b) =>
        b.has_ebook ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <IconDocument className="h-4 w-4" /> Attached
          </span>
        ) : (
          "-"
        ),
    },
    {
      header: "Actions",
      key: "actions",
      render: (b) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => openEdit(b)}>
            Edit
          </Button>
          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setEbookTarget(b)}>
            {b.has_ebook ? "Replace Ebook" : "Add Ebook"}
          </Button>
          <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => setDeleteTarget(b)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Manage Books</h1>
        <Button onClick={openCreate}>+ Add Book</Button>
      </div>

      <Input
        placeholder="Search by title, author, or ISBN"
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
          <Table columns={columns} rows={data?.results ?? []} keyExtractor={(b) => b.id} />
          {data && <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPageChange={setPage} />}
        </>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? "Edit Book" : "Add Book"}>
        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="isbn"
              label="ISBN"
              value={form.isbn}
              onChange={(e) => setForm({ ...form, isbn: e.target.value })}
              required
            />
            <Select
              id="category"
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Uncategorized</option>
              {categories?.results.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Input
            id="title"
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            id="author"
            label="Author"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            required
          />
          <Textarea
            id="description"
            label="Description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="publisher"
              label="Publisher"
              value={form.publisher}
              onChange={(e) => setForm({ ...form, publisher: e.target.value })}
            />
            <Input
              id="publication_year"
              label="Publication year"
              type="number"
              value={form.publication_year}
              onChange={(e) => setForm({ ...form, publication_year: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              id="total_copies"
              label="Total copies"
              type="number"
              min={0}
              value={form.total_copies}
              onChange={(e) => setForm({ ...form, total_copies: e.target.value })}
              required
            />
            <Input
              id="available_copies"
              label="Available copies"
              type="number"
              min={0}
              value={form.available_copies}
              onChange={(e) => setForm({ ...form, available_copies: e.target.value })}
              required
            />
            <Input
              id="shelf_location"
              label="Shelf location"
              value={form.shelf_location}
              onChange={(e) => setForm({ ...form, shelf_location: e.target.value })}
            />
          </div>
          <Input
            id="cover_image"
            label="Cover image"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              {editing ? "Save changes" : "Create book"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Book">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.
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

      <Modal
        isOpen={!!ebookTarget}
        onClose={() => {
          setEbookTarget(null);
          setEbookFile(null);
        }}
        title={`${ebookTarget?.has_ebook ? "Replace" : "Add"} Ebook — ${ebookTarget?.title ?? ""}`}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Upload a PDF. Once attached, students can read it online from the book's detail page - this doesn't
            affect physical copies or borrowing.
          </p>
          <Input
            label="PDF file (max 25 MB)"
            type="file"
            accept="application/pdf"
            onChange={(e) => setEbookFile(e.target.files?.[0] ?? null)}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEbookTarget(null);
                setEbookFile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => ebookMutation.mutate()} isLoading={ebookMutation.isPending} disabled={!ebookFile}>
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
