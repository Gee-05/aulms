import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { updateMe } from "../api/auth";
import { extractErrorMessage } from "../api/client";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import type { StudentProfile } from "../types";

function isStudentProfile(profile: unknown): profile is StudentProfile {
  return !!profile && typeof profile === "object" && "student_id" in profile;
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const profile = user?.profile;
  const studentProfile = isStudentProfile(profile) ? profile : null;

  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
    phone_number: user?.phone_number ?? "",
    address: studentProfile?.address ?? "",
    date_of_birth: studentProfile?.date_of_birth ?? "",
  });

  const mutation = useMutation({
    mutationFn: () => updateMe(form),
    onSuccess: async () => {
      toast.success("Profile updated.");
      await refreshUser();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="page-title mb-6">My Profile</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="glass-card flex flex-col gap-4 p-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="first_name"
            label="First name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
          <Input
            id="last_name"
            label="Last name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
        </div>
        <Input
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          id="phone_number"
          label="Phone number"
          value={form.phone_number}
          onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
        />
        {user.role === "student" && (
          <>
            <Input
              id="address"
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Input
              id="date_of_birth"
              label="Date of birth"
              type="date"
              value={form.date_of_birth ?? ""}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            />
            {studentProfile && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Student ID: {studentProfile.student_id} &middot; Member since {studentProfile.membership_date}
              </p>
            )}
          </>
        )}
        <Button type="submit" isLoading={mutation.isPending} className="w-fit">
          Save changes
        </Button>
      </form>
    </div>
  );
}
