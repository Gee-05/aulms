import { apiClient } from "./client";
import type { Notification, Paginated } from "../types";

export async function listNotifications(params: Record<string, string | number | undefined> = {}) {
  const { data } = await apiClient.get("/notifications/", { params });
  return data as Paginated<Notification>;
}

export async function markNotificationRead(id: number) {
  const { data } = await apiClient.post(`/notifications/${id}/mark_read/`);
  return data as Notification;
}

export async function markAllNotificationsRead() {
  await apiClient.post("/notifications/mark_all_read/");
}

export async function getUnreadCount() {
  const { data } = await apiClient.get("/notifications/unread_count/");
  return data as { count: number };
}
