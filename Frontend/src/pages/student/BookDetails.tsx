import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { createReservation, getBook, readBookOnline } from "../../api/books";
import { createBorrowRequest } from "../../api/borrowing";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import StatusBadge from "../../components/ui/StatusBadge";
import { IconBookOpen, IconX } from "../../components/icons";

export default function BookDetails() {
  const { id } = useParams<{ id: string }>();
  const bookId = Number(id);
  const queryClient = useQueryClient();
  const [reader, setReader] = useState<{ url: string; title: string } | null>(null);

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => getBook(bookId),
    enabled: Number.isFinite(bookId),
  });

  const borrowMutation = useMutation({
    mutationFn: () => createBorrowRequest(bookId),
    onSuccess: () => {
      toast.success("Borrow request submitted. Awaiting librarian approval.");
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      queryClient.invalidateQueries({ queryKey: ["borrow-requests"] });
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const reserveMutation = useMutation({
    mutationFn: () => createReservation(bookId),
    onSuccess: () => {
      toast.success("Book reserved. You'll be notified when it's available.");
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const readMutation = useMutation({
    mutationFn: () => readBookOnline(bookId),
    onSuccess: (data) => setReader(data),
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  if (isLoading) return <Spinner />;
  if (!book) return <p className="text-sm text-slate-500 dark:text-slate-400">Book not found.</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="glass-card flex flex-col gap-6 p-6 sm:flex-row">
        <div className="flex h-56 w-40 shrink-0 items-center justify-center self-center rounded-md bg-slate-100 dark:bg-slate-800 sm:self-start">
          {book.cover_image ? (
            <img src={book.cover_image} alt={book.title} className="h-full w-full rounded-md object-cover" />
          ) : (
            <IconBookOpen className="h-14 w-14 text-slate-400 dark:text-slate-500" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{book.title}</h1>
              <p className="text-slate-500 dark:text-slate-400">{book.author}</p>
            </div>
            <StatusBadge status={book.status} />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-slate-500 dark:text-slate-400">ISBN</dt>
            <dd className="text-slate-900 dark:text-slate-100">{book.isbn}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Category</dt>
            <dd className="text-slate-900 dark:text-slate-100">{book.category_name ?? "Uncategorized"}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Publisher</dt>
            <dd className="text-slate-900 dark:text-slate-100">{book.publisher || "-"}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Publication Year</dt>
            <dd className="text-slate-900 dark:text-slate-100">{book.publication_year ?? "-"}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Shelf Location</dt>
            <dd className="text-slate-900 dark:text-slate-100">{book.shelf_location || "-"}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Availability</dt>
            <dd className="text-slate-900 dark:text-slate-100">
              {book.available_copies} / {book.total_copies} copies
            </dd>
          </dl>
          {book.description && <p className="text-sm text-slate-600 dark:text-slate-300">{book.description}</p>}

          <div className="mt-2 flex flex-wrap gap-3">
            {book.available_copies > 0 ? (
              <Button
                onClick={() => borrowMutation.mutate()}
                isLoading={borrowMutation.isPending}
                disabled={book.status === "lost"}
              >
                Submit Borrow Request
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => reserveMutation.mutate()}
                isLoading={reserveMutation.isPending}
                disabled={book.status === "lost"}
              >
                Reserve This Book
              </Button>
            )}
            {book.has_ebook && (
              <Button variant="secondary" onClick={() => readMutation.mutate()} isLoading={readMutation.isPending}>
                <IconBookOpen className="h-4 w-4" />
                Read Online
              </Button>
            )}
          </div>
        </div>
      </div>

      {reader && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 p-4 backdrop-blur-sm">
          <div className="glass-card flex flex-1 flex-col overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-white/40 px-4 py-3 dark:border-white/10">
              <h2 className="truncate font-semibold text-slate-900 dark:text-slate-100">{reader.title}</h2>
              <div className="flex items-center gap-3">
                <a
                  href={reader.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Open in new tab
                </a>
                <button
                  onClick={() => setReader(null)}
                  aria-label="Close reader"
                  className="rounded-md p-1 text-slate-400 hover:bg-white/50 hover:text-slate-600 dark:hover:bg-white/10"
                >
                  <IconX className="h-5 w-5" />
                </button>
              </div>
            </div>
            <iframe src={reader.url} title={reader.title} className="h-full w-full flex-1 bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}
