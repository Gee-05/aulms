import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import {
  IconBookOpen,
  IconChartBar,
  IconClipboard,
  IconClock,
  IconCog,
  IconCurrencyDollar,
  IconDocumentText,
  IconHome,
  IconLibrary,
  IconRefresh,
  IconTag,
  IconUser,
  IconUsers,
  IconWrench,
} from "../icons";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import type { ComponentType, SVGProps } from "react";
import type { Role } from "../../types";

const DJANGO_ADMIN_URL = `${API_BASE_URL.replace(/\/api\/?$/, "")}/admin/`;

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  label: string;
  to: string;
  icon: IconComponent;
  end?: boolean;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  student: [
    { label: "Dashboard", to: "/student", icon: IconHome, end: true },
    { label: "Book Catalog", to: "/student/catalog", icon: IconLibrary },
    { label: "My Requests", to: "/student/requests", icon: IconClipboard },
    { label: "My Borrows", to: "/student/borrows", icon: IconBookOpen },
    { label: "Borrow History", to: "/student/history", icon: IconClock },
    { label: "My Fines", to: "/student/fines", icon: IconCurrencyDollar },
    { label: "Profile", to: "/student/profile", icon: IconUser },
  ],
  librarian: [
    { label: "Dashboard", to: "/librarian", icon: IconHome, end: true },
    { label: "Borrow Requests", to: "/librarian/requests", icon: IconClipboard },
    { label: "Returns & Renewals", to: "/librarian/returns", icon: IconRefresh },
    { label: "Books", to: "/librarian/books", icon: IconLibrary },
    { label: "Categories", to: "/librarian/categories", icon: IconTag },
    { label: "Students", to: "/librarian/students", icon: IconUsers },
    { label: "Reports", to: "/librarian/reports", icon: IconChartBar },
    { label: "Profile", to: "/librarian/profile", icon: IconUser },
  ],
  admin: [
    { label: "Dashboard", to: "/admin", icon: IconHome, end: true },
    { label: "Users", to: "/admin/users", icon: IconUsers },
    { label: "Activity Logs", to: "/admin/activity-logs", icon: IconDocumentText },
    { label: "Reports", to: "/admin/reports", icon: IconChartBar },
    { label: "Settings", to: "/admin/settings", icon: IconCog },
  ],
};

const ROLE_LABELS: Record<Role, string> = {
  student: "Student Portal",
  librarian: "Librarian Portal",
  admin: "Admin Portal",
};

interface SidebarProps {
  role: Role;
  collapsed: boolean;
}

export default function Sidebar({ role, collapsed }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } finally {
      setLoggingOut(false);
      setConfirmingLogout(false);
    }
  }

  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || user?.username;
  const initial = (user?.first_name || user?.username || "?").charAt(0).toUpperCase();

  return (
    <nav
      className={`glass-chrome relative z-10 flex h-full shrink-0 flex-col border-r p-4 transition-[width] duration-200 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className={`mb-6 flex items-center gap-3 px-1 ${collapsed ? "justify-center px-0" : ""}`}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
          <IconLibrary className="h-6 w-6" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100">AULMS Library</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{ROLE_LABELS[role]}</p>
          </div>
        )}
      </div>

      {!collapsed && (
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Navigation
        </p>
      )}

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS[role].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                collapsed ? "justify-center px-0" : ""
              } ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-900/20"
                  : "text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/5"
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
        {role === "admin" && (
          <a
            href={DJANGO_ADMIN_URL}
            title={collapsed ? "Advanced Settings" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/5 ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            <IconWrench className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">Advanced Settings</span>}
          </a>
        )}
      </div>

      <div
        className={`mt-4 flex items-center gap-3 border-t border-white/40 pt-4 dark:border-white/10 ${
          collapsed ? "flex-col px-0" : "px-1"
        }`}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md"
          title={collapsed ? fullName : undefined}
        >
          {initial}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{fullName}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        )}
        <button
          onClick={() => setConfirmingLogout(true)}
          aria-label="Log out"
          title="Log out"
          className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-white/50 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>

      <Modal isOpen={confirmingLogout} onClose={() => setConfirmingLogout(false)} title="Log out?">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to log out of your {ROLE_LABELS[role].toLowerCase()} account?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmingLogout(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogout} isLoading={loggingOut}>
            Log out
          </Button>
        </div>
      </Modal>
    </nav>
  );
}
