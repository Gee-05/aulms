import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { getUnreadCount, listNotifications, markAllNotificationsRead, markNotificationRead } from "../../api/notifications";
import { IconBell } from "../icons";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: unread } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: () => listNotifications({ page_size: 8 }),
    enabled: open,
  });

  async function handleMarkAll() {
    await markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function handleMarkOne(id: number) {
    await markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative rounded-md p-2 text-slate-500 hover:bg-white/50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
      >
        <IconBell className="h-5 w-5" />
        {!!unread?.count && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {unread.count > 9 ? "9+" : unread.count}
          </span>
        )}
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-10" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="glass-card absolute right-0 z-20 mt-2 w-80 p-2 shadow-xl">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</span>
              <button onClick={handleMarkAll} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications?.results.length === 0 && (
                <p className="px-2 py-4 text-center text-sm text-slate-500 dark:text-slate-400">No notifications yet.</p>
              )}
              {notifications?.results.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkOne(n.id)}
                  className={`block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    n.is_read ? "text-slate-500 dark:text-slate-400" : "font-medium text-slate-900 dark:text-slate-100"
                  }`}
                >
                  <p>{n.message}</p>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
