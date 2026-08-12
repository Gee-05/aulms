import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "react-toastify";
import { getLibraryPolicy, updateLibraryPolicy } from "../../api/core";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import type { LibraryPolicy } from "../../types";

type FormState = Record<keyof Omit<LibraryPolicy, "updated_at">, string>;

const FIELDS: Array<{ key: keyof FormState; label: string; hint: string; step?: string }> = [
  { key: "loan_period_days", label: "Student loan period (days)", hint: "Default due-date window for student members." },
  { key: "faculty_loan_period_days", label: "Faculty loan period (days)", hint: "Due-date window for faculty members." },
  { key: "guest_loan_period_days", label: "Guest loan period (days)", hint: "Due-date window for guest patrons." },
  { key: "max_active_loans_student", label: "Max active loans (student)", hint: "Concurrent borrow cap for students." },
  { key: "max_active_loans_faculty", label: "Max active loans (faculty)", hint: "Concurrent borrow cap for faculty." },
  { key: "max_active_loans_guest", label: "Max active loans (guest)", hint: "Concurrent borrow cap for guests." },
  { key: "fine_per_day", label: "Fine per day ($)", hint: "Charged per day overdue, applied on return.", step: "0.01" },
  { key: "max_renewals", label: "Max renewals", hint: "Renewals allowed per borrowed book." },
  { key: "renewal_period_days", label: "Renewal period (days)", hint: "Days added to the due date per renewal." },
  { key: "due_soon_reminder_days", label: "Due-soon reminder window (days)", hint: "How early to send a due-soon notice." },
];

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: policy, isLoading } = useQuery({ queryKey: ["library-policy"], queryFn: getLibraryPolicy });
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (policy) {
      const { updated_at: _updated_at, ...rest } = policy;
      const stringified = Object.fromEntries(
        Object.entries(rest).map(([key, value]) => [key, String(value)]),
      ) as FormState;
      setForm(stringified);
    }
  }, [policy]);

  const mutation = useMutation({
    mutationFn: () => updateLibraryPolicy(form as unknown as Partial<LibraryPolicy>),
    onSuccess: (updated) => {
      toast.success("Borrowing policy updated.");
      queryClient.setQueryData(["library-policy"], updated);
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  if (isLoading || !form) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="page-title mb-1">Borrowing Policy</h1>
      <p className="page-subtitle mb-6">
        Loan durations, renewal rules, and fine rates used across the whole system - changes apply immediately to
        future approvals/returns.
      </p>
      <form onSubmit={handleSubmit} className="glass-card flex flex-col gap-4 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <Input
              key={field.key}
              id={field.key}
              label={field.label}
              type="number"
              min={0}
              step={field.step ?? "1"}
              value={form[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            />
          ))}
        </div>
        <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 border-t border-slate-200 pt-4 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <li key={field.key}>
              <strong>{field.label}:</strong> {field.hint}
            </li>
          ))}
        </ul>
        <Button type="submit" isLoading={mutation.isPending} className="mt-2 w-fit">
          Save policy
        </Button>
      </form>
    </div>
  );
}
