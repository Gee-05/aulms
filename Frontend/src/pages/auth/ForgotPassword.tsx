import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { requestPasswordReset } from "../../api/auth";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await requestPasswordReset(values.email);
      setSent(true);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell-bg flex min-h-screen items-center justify-center px-4">
      <div className="glass-auth-card w-full max-w-sm p-8">
        <h1 className="mb-1 text-center text-2xl font-bold text-white drop-shadow-sm">Forgot your password?</h1>
        <p className="mb-6 text-center text-sm text-white/70">
          Enter your account email and we'll send you a reset link.
        </p>
        {sent ? (
          <p className="rounded-md bg-white/10 p-4 text-center text-sm text-white/90">
            If an account with that email exists, a password reset link has been sent. Check your inbox (or the
            server console, in local dev).
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              className="border-white/20 bg-white/90 placeholder:text-slate-400"
              labelClassName="text-sm font-medium text-white/90"
              {...register("email")}
            />
            <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
              Send reset link
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-white/70">
          <Link to="/login" className="font-medium text-white hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
