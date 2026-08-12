import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  if (!user) return null;

  return (
    <div className="flex h-screen flex-col">
      <div className="app-shell-bg" aria-hidden="true" />
      <Navbar collapsed={collapsed} onToggleSidebar={() => setCollapsed((prev) => !prev)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} collapsed={collapsed} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
