import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { confirmPasswordReset } from "../../api/auth";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    password2: z.string().min(8, "At least 8 characters"),
  })
  .refine((data) => data.password === data.password2, {
    message: "Passwords do not match",
    path: ["password2"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    if (!uid || !token) {
      toast.error("This reset link is missing required information.");
      return;
    }
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(uid, token, values.password);
      toast.success("Password reset. You can now log in.");
      navigate("/login");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell-bg flex min-h-screen items-center justify-center px-4">
      <div className="glass-auth-card w-full max-w-sm p-8">
        <h1 className="mb-1 text-center text-2xl font-bold text-white drop-shadow-sm">Reset your password</h1>
        <p className="mb-6 text-center text-sm text-white/70">Choose a new password for your account.</p>

        {!uid || !token ? (
          <p className="rounded-md bg-white/10 p-4 text-center text-sm text-white/90">
            This reset link is invalid or incomplete. Please request a new one.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="New password"
              type="password"
              error={errors.password?.message}
              className="border-white/20 bg-white/90 placeholder:text-slate-400"
              labelClassName="text-sm font-medium text-white/90"
              {...register("password")}
            />
            <Input
              label="Confirm new password"
              type="password"
              error={errors.password2?.message}
              className="border-white/20 bg-white/90 placeholder:text-slate-400"
              labelClassName="text-sm font-medium text-white/90"
              {...register("password2")}
            />
            <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
              Reset password
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
