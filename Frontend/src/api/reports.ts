import { apiClient } from "./client";

export interface SummaryReport {
  total_books: number;
  available_books: number;
  borrowed_books: number;
  reserved_books: number;
  overdue_books: number;
  lost_books: number;
  pending_requests: number;
  total_students: number;
  active_borrow_records: number;
  outstanding_fines: number;
}

export async function getSummaryReport() {
  const { data } = await apiClient.get("/reports/summary/");
  return data as SummaryReport;
}

export interface OverdueEntry {
  student: string;
  email: string;
  book: string;
  due_date: string;
  days_overdue: number;
  estimated_fine: number;
  record: number;
}

export async function getOverdueReport() {
  const { data } = await apiClient.get("/reports/overdue/");
  return data as OverdueEntry[];
}

export async function getBorrowHistoryReport(params: Record<string, string | number | undefined> = {}) {
  const { data } = await apiClient.get("/reports/borrow-history/", { params });
  return data as Array<Record<string, unknown>>;
}

export async function getMostBorrowedReport(limit = 10) {
  const { data } = await apiClient.get("/reports/most-borrowed/", { params: { limit } });
  return data as Array<{ title: string; author: string; isbn: string; times_borrowed: number }>;
}

export async function getStudentActivityReport(only?: "active" | "inactive") {
  const { data } = await apiClient.get("/reports/student-activity/", { params: { only } });
  return data as Array<{ student: string; student_id: string; total_borrows: number; activity: string }>;
}

export async function getFineReport(isPaid?: boolean) {
  const { data } = await apiClient.get("/reports/fines/", {
    params: { is_paid: isPaid === undefined ? undefined : String(isPaid) },
  });
  return data as Array<Record<string, unknown>>;
}

export async function getMonthlyStats(year: number) {
  const { data } = await apiClient.get("/reports/monthly/", { params: { year } });
  return data as Array<{ month: string; count: number }>;
}

export async function getYearlyStats() {
  const { data } = await apiClient.get("/reports/yearly/");
  return data as Array<{ year: number; count: number }>;
}

const REPORT_PATHS: Record<string, string> = {
  summary: "summary",
  overdue: "overdue",
  "borrow-history": "borrow-history",
  "most-borrowed": "most-borrowed",
  "student-activity": "student-activity",
  fines: "fines",
  monthly: "monthly",
  yearly: "yearly",
};

/** Fetches a report as a PDF/Excel blob (with auth headers) and triggers a browser download. */
export async function downloadReport(
  report: keyof typeof REPORT_PATHS,
  format: "pdf" | "xlsx",
  extraParams: Record<string, string | number | undefined> = {},
) {
  const response = await apiClient.get(`/reports/${REPORT_PATHS[report]}/`, {
    params: { ...extraParams, export: format },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
