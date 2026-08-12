import { apiClient } from "./client";
import type { LibrarianProfile, Me, MembershipType, Paginated, StudentProfile, User } from "../types";

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  membership_type?: MembershipType;
}

export async function register(payload: RegisterPayload) {
  const { data } = await apiClient.post("/auth/register/", payload);
  return data as { detail: string };
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: { id: number; username: string; role: string; first_name: string; last_name: string };
}

export async function login(username: string, password: string) {
  const { data } = await apiClient.post("/auth/login/", { username, password });
  return data as LoginResponse;
}

export async function logout(refresh: string) {
  await apiClient.post("/auth/logout/", { refresh });
}

export async function getMe() {
  const { data } = await apiClient.get("/auth/me/");
  return data as Me;
}

export async function updateMe(payload: Partial<{
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  department: string;
}>) {
  const { data } = await apiClient.patch("/auth/me/", payload);
  return data as Me;
}

export async function listStudents(params: Record<string, string | number | undefined> = {}) {
  const { data } = await apiClient.get("/auth/students/", { params });
  return data as Paginated<StudentProfile>;
}

export async function updateStudent(id: number, payload: Partial<StudentProfile>) {
  const { data } = await apiClient.patch(`/auth/students/${id}/`, payload);
  return data as StudentProfile;
}

export async function deleteStudent(id: number) {
  await apiClient.delete(`/auth/students/${id}/`);
}

export async function listLibrarians(params: Record<string, string | number | undefined> = {}) {
  const { data } = await apiClient.get("/auth/librarians/", { params });
  return data as Paginated<LibrarianProfile>;
}

export async function requestPasswordReset(email: string) {
  const { data } = await apiClient.post("/auth/password-reset/", { email });
  return data as { detail: string };
}

export async function confirmPasswordReset(uid: string, token: string, newPassword: string) {
  const { data } = await apiClient.post("/auth/password-reset/confirm/", {
    uid,
    token,
    new_password: newPassword,
  });
  return data as { detail: string };
}

export async function listAllUsers(params: Record<string, string | number | undefined> = {}) {
  const { data } = await apiClient.get("/auth/users/", { params });
  return data as Paginated<User>;
}

export async function setUserActive(id: number, isActive: boolean) {
  const { data } = await apiClient.patch(`/auth/users/${id}/`, { is_active: isActive });
  return data as User;
}

export async function deleteUser(id: number) {
  await apiClient.delete(`/auth/users/${id}/`);
}
