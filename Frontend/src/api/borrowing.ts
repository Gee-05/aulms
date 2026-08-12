import { apiClient } from "./client";
import type { BorrowRecord, BorrowRequest, Fine, Paginated } from "../types";

export async function listBorrowRequests(params: Record<string, string | number | undefined> = {}) {
  const { data } = await apiClient.get("/borrowing/requests/", { params });
  return data as Paginated<BorrowRequest>;
}

export async function createBorrowRequest(book: number) {
  const { data } = await apiClient.post("/borrowing/requests/", { book });
  return data as BorrowRequest;
}

export async function approveBorrowRequest(id: number, dueDate?: string) {
  const { data } = await apiClient.post(`/borrowing/requests/${id}/approve/`, {
    due_date: dueDate,
  });
  return data as BorrowRecord;
}

export async function rejectBorrowRequest(id: number, reason?: string) {
  const { data } = await apiClient.post(`/borrowing/requests/${id}/reject/`, { reason });
  return data as BorrowRequest;
}

export async function cancelBorrowRequest(id: number) {
  const { data } = await apiClient.post(`/borrowing/requests/${id}/cancel/`);
  return data as BorrowRequest;
}

export async function listBorrowRecords(params: Record<string, string | number | undefined> = {}) {
  const { data } = await apiClient.get("/borrowing/records/", { params });
  return data as Paginated<BorrowRecord>;
}

export async function returnBook(id: number) {
  const { data } = await apiClient.post(`/borrowing/records/${id}/return_book/`);
  return data as BorrowRecord;
}

export async function requestRenewal(id: number) {
  const { data } = await apiClient.post(`/borrowing/records/${id}/request_renewal/`);
  return data as BorrowRecord;
}

export async function approveRenewal(id: number) {
  const { data } = await apiClient.post(`/borrowing/records/${id}/approve_renewal/`);
  return data as BorrowRecord;
}

export async function rejectRenewal(id: number, reason?: string) {
  const { data } = await apiClient.post(`/borrowing/records/${id}/reject_renewal/`, { reason });
  return data as BorrowRecord;
}

export async function markLost(id: number) {
  const { data } = await apiClient.post(`/borrowing/records/${id}/mark_lost/`);
  return data as BorrowRecord;
}

export async function listFines(params: Record<string, string | number | undefined> = {}) {
  const { data } = await apiClient.get("/borrowing/fines/", { params });
  return data as Paginated<Fine>;
}

export async function markFinePaid(id: number) {
  const { data } = await apiClient.post(`/borrowing/fines/${id}/mark_paid/`);
  return data as Fine;
}

export async function payFine(id: number) {
  const { data } = await apiClient.post(`/borrowing/fines/${id}/pay/`);
  return data as Fine;
}

export async function issueBook(studentId: number, bookId: number, dueDate?: string) {
  const { data } = await apiClient.post("/borrowing/requests/issue/", {
    student: studentId,
    book: bookId,
    due_date: dueDate,
  });
  return data as BorrowRecord;
}
