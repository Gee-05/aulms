import { apiClient } from "./client";
import type { ActivityLog, LibraryPolicy, Paginated } from "../types";

export async function listActivityLogs(params: Record<string, string | number | undefined> = {}) {
  const { data } = await apiClient.get("/core/activity-logs/", { params });
  return data as Paginated<ActivityLog>;
}

export async function getLibraryPolicy() {
  const { data } = await apiClient.get("/core/policy/");
  return data as LibraryPolicy;
}

export async function updateLibraryPolicy(payload: Partial<LibraryPolicy>) {
  const { data } = await apiClient.patch("/core/policy/", payload);
  return data as LibraryPolicy;
}
