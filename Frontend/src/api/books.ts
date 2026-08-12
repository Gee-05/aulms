import { apiClient } from "./client";
import type { Book, BookReservation, Category, Paginated } from "../types";

export interface BookListParams {
  search?: string;
  category?: number;
  status?: string;
  author?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export async function listBooks(params: BookListParams = {}) {
  const { data } = await apiClient.get("/books/", { params });
  return data as Paginated<Book>;
}

export async function getBook(id: number) {
  const { data } = await apiClient.get(`/books/${id}/`);
  return data as Book;
}

export async function createBook(payload: FormData) {
  const { data } = await apiClient.post("/books/", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as Book;
}

export async function updateBook(id: number, payload: FormData) {
  const { data } = await apiClient.patch(`/books/${id}/`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as Book;
}

export async function deleteBook(id: number) {
  await apiClient.delete(`/books/${id}/`);
}

export async function uploadEbook(id: number, file: File) {
  const fd = new FormData();
  fd.append("ebook_file", file);
  const { data } = await apiClient.post(`/books/${id}/upload_ebook/`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as Book;
}

export async function readBookOnline(id: number) {
  const { data } = await apiClient.get(`/books/${id}/read/`);
  return data as { url: string; title: string };
}

export async function listCategories(search = "") {
  const { data } = await apiClient.get("/books/categories/", { params: { search, page_size: 100 } });
  return data as Paginated<Category>;
}

export async function createCategory(payload: { name: string; description?: string }) {
  const { data } = await apiClient.post("/books/categories/", payload);
  return data as Category;
}

export async function updateCategory(id: number, payload: { name?: string; description?: string }) {
  const { data } = await apiClient.patch(`/books/categories/${id}/`, payload);
  return data as Category;
}

export async function deleteCategory(id: number) {
  await apiClient.delete(`/books/categories/${id}/`);
}

export async function listReservations(params: Record<string, string | number | undefined> = {}) {
  const { data } = await apiClient.get("/books/reservations/", { params });
  return data as Paginated<BookReservation>;
}

export async function createReservation(book: number) {
  const { data } = await apiClient.post("/books/reservations/", { book });
  return data as BookReservation;
}

export async function cancelReservation(id: number) {
  await apiClient.delete(`/books/reservations/${id}/`);
}
