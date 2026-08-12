import { useAuth } from "../../context/AuthContext";
import { IconPanelLeft } from "../icons";
import ThemeToggle from "../ui/ThemeToggle";
import NotificationBell from "./NotificationBell";
import type { Role } from "../../types";

const ROLE_LABELS: Record<Role, string> = {
  student: "Student Portal",
  librarian: "Librarian Portal",
  admin: "Admin Portal",
};

interface NavbarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ collapsed, onToggleSidebar }: NavbarProps) {
  const { user } = useAuth();

  return (
    <header className="glass-chrome relative z-20 flex h-16 shrink-0 items-center justify-between border-b px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-md p-1.5 text-slate-500 hover:bg-white/50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
        >
          <IconPanelLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {user ? ROLE_LABELS[user.role] : ""}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
