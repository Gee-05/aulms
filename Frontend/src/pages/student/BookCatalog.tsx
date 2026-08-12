import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listBooks, listCategories } from "../../api/books";
import BookCard from "../../components/books/BookCard";
import Pagination from "../../components/ui/Pagination";
import { Input, Select } from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";

const PAGE_SIZE = 12;

export default function BookCatalog() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  const { data, isLoading } = useQuery({
    queryKey: ["books", { search, category, status, page }],
    queryFn: () =>
      listBooks({
        search: search || undefined,
        category: category ? Number(category) : undefined,
        status: status || undefined,
        page,
        page_size: PAGE_SIZE,
      }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Book Catalog</h1>
        <p className="page-subtitle">Search and browse the library collection.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          placeholder="Search by title, author, or ISBN"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <Select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
        >
          <option value="">All categories</option>
          {categories?.results.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="pending">Pending Request</option>
          <option value="reserved">Reserved</option>
          <option value="borrowed">Borrowed</option>
          <option value="overdue">Overdue</option>
        </Select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data?.results.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          {data?.results.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">No books match your search.</p>
          )}
          {data && (
            <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
