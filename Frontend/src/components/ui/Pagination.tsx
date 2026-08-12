import Button from "./Button";

interface PaginationProps {
  page: number;
  pageSize: number;
  count: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, count, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-2 py-3 dark:border-slate-700">
      <span className="text-sm text-slate-600 dark:text-slate-400">
        Page {page} of {totalPages} &middot; {count} total
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
