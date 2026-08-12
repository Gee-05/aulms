import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Spinner from "./components/ui/Spinner";
import { useAuth } from "./context/AuthContext";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import ActivityLogs from "./pages/admin/ActivityLogs";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import Settings from "./pages/admin/Settings";
import ManageBooks from "./pages/librarian/ManageBooks";
import ManageCategories from "./pages/librarian/ManageCategories";
import ManageRequests from "./pages/librarian/ManageRequests";
import ManageStudents from "./pages/librarian/ManageStudents";
import ReturnsAndRenewals from "./pages/librarian/ReturnsAndRenewals";
import LibrarianDashboard from "./pages/librarian/Dashboard";
import BookCatalog from "./pages/student/BookCatalog";
import BookDetails from "./pages/student/BookDetails";
import BorrowHistory from "./pages/student/BorrowHistory";
import StudentDashboard from "./pages/student/Dashboard";
import MyBorrows from "./pages/student/MyBorrows";
import MyFines from "./pages/student/MyFines";
import MyRequests from "./pages/student/MyRequests";
import ProtectedRoute from "./routes/ProtectedRoute";
import type { Role } from "./types";

const ROLE_HOME: Record<Role, string> = {
  student: "/student",
  librarian: "/librarian",
  admin: "/admin",
};

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  return <Navigate to={user ? ROLE_HOME[user.role] : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute roles={["student"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/catalog" element={<BookCatalog />} />
          <Route path="/student/catalog/:id" element={<BookDetails />} />
          <Route path="/student/requests" element={<MyRequests />} />
          <Route path="/student/borrows" element={<MyBorrows />} />
          <Route path="/student/history" element={<BorrowHistory />} />
          <Route path="/student/fines" element={<MyFines />} />
          <Route path="/student/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["librarian"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/librarian" element={<LibrarianDashboard />} />
          <Route path="/librarian/requests" element={<ManageRequests />} />
          <Route path="/librarian/returns" element={<ReturnsAndRenewals />} />
          <Route path="/librarian/books" element={<ManageBooks />} />
          <Route path="/librarian/categories" element={<ManageCategories />} />
          <Route path="/librarian/students" element={<ManageStudents />} />
          <Route path="/librarian/reports" element={<Reports />} />
          <Route path="/librarian/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/activity-logs" element={<ActivityLogs />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
