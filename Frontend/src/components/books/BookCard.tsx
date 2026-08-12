import { Link } from "react-router-dom";
import { IconBookOpen } from "../icons";
import StatusBadge from "../ui/StatusBadge";
import type { Book } from "../../types";

export default function BookCard({ book }: { book: Book }) {
  return (
    <Link
      to={`/student/catalog/${book.id}`}
      className="glass-card flex flex-col overflow-hidden transition-shadow hover:shadow-xl"
    >
      <div className="flex h-40 items-center justify-center bg-slate-100 dark:bg-slate-800">
        {book.cover_image ? (
          <img src={book.cover_image} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <IconBookOpen className="h-10 w-10 text-slate-400 dark:text-slate-500" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-semibold text-slate-900 dark:text-slate-100">{book.title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{book.author}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <StatusBadge status={book.status} />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {book.available_copies}/{book.total_copies} available
          </span>
        </div>
      </div>
    </Link>
  );
}
