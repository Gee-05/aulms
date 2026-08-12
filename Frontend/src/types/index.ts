export type Role = "student" | "librarian" | "admin";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: Role;
  date_joined: string;
  is_active: boolean;
}

export type MembershipType = "student" | "faculty" | "guest";

export interface StudentProfile {
  id: number;
  user: User;
  student_id: string;
  membership_type: MembershipType;
  address: string;
  date_of_birth: string | null;
  membership_date: string;
  is_active_member: boolean;
}

export interface LibrarianProfile {
  id: number;
  user: User;
  employee_id: string;
  department: string;
}

export interface Me extends User {
  profile: StudentProfile | LibrarianProfile | null;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  book_count: number;
}

export type BookStatus =
  | "available"
  | "pending"
  | "reserved"
  | "borrowed"
  | "overdue"
  | "lost";

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  category: number | null;
  category_name: string | null;
  description: string;
  publisher: string;
  publication_year: number | null;
  total_copies: number;
  available_copies: number;
  shelf_location: string;
  cover_image: string | null;
  ebook_file: string | null;
  has_ebook: boolean;
  qr_code: string | null;
  status: BookStatus;
  created_at: string;
  updated_at: string;
}

export interface BookReservation {
  id: number;
  book: number;
  book_title: string;
  student: number;
  student_name: string;
  status: "active" | "fulfilled" | "cancelled" | "expired";
  reserved_at: string;
  expires_at: string | null;
}

export type BorrowRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface BorrowRequest {
  id: number;
  student: number;
  student_name: string;
  book: number;
  book_title: string;
  status: BorrowRequestStatus;
  request_date: string;
  processed_by: number | null;
  processed_by_name: string | null;
  processed_at: string | null;
  borrow_date: string | null;
  due_date: string | null;
  rejection_reason: string;
}

export type BorrowRecordStatus = "borrowed" | "returned" | "overdue" | "lost";
export type RenewalStatus = "" | "pending" | "approved" | "rejected";

export interface Fine {
  id: number;
  record: number;
  book_title: string;
  student_name: string;
  amount: string;
  reason: string;
  is_paid: boolean;
  created_at: string;
  paid_at: string | null;
}

export interface BorrowRecord {
  id: number;
  request: number;
  student: number;
  student_name: string;
  book: number;
  book_title: string;
  book_isbn: string;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: BorrowRecordStatus;
  renewal_count: number;
  renewal_requested: boolean;
  renewal_status: RenewalStatus;
  fines: Fine[];
  created_at: string;
}

export type NotificationType =
  | "request_approved"
  | "request_rejected"
  | "due_soon"
  | "overdue"
  | "returned"
  | "renewal_approved"
  | "renewal_rejected"
  | "fine_issued"
  | "general";

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user: number | null;
  user_name: string;
  action: string;
  model_name: string;
  object_id: string;
  description: string;
  timestamp: string;
}

export interface LibraryPolicy {
  loan_period_days: number;
  faculty_loan_period_days: number;
  guest_loan_period_days: number;
  max_active_loans_student: number;
  max_active_loans_faculty: number;
  max_active_loans_guest: number;
  fine_per_day: string;
  max_renewals: number;
  renewal_period_days: number;
  due_soon_reminder_days: number;
  updated_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail: string;
  errors: Record<string, string[]> | string | null;
}
