import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../types";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

const ROLE_HOME: Record<Role, string> = {
  student: "/student",
  librarian: "/librarian",
  admin: "/admin",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const me = await login(values.username, values.password);
      toast.success(`Welcome back, ${me.first_name || me.username}!`);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? ROLE_HOME[me.role], { replace: true });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell-bg flex min-h-screen items-center justify-center px-4">
      <div className="glass-auth-card w-full max-w-sm p-8">
        <h1 className="mb-1 text-center text-2xl font-bold text-white drop-shadow-sm">AULMS Library</h1>
        <p className="mb-6 text-center text-sm text-white/70">Sign in to your account</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Username"
            autoComplete="username"
            error={errors.username?.message}
            className="border-white/20 bg-white/90 placeholder:text-slate-400"
            labelClassName="text-sm font-medium text-white/90"
            {...register("username")}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            className="border-white/20 bg-white/90 placeholder:text-slate-400"
            labelClassName="text-sm font-medium text-white/90"
            {...register("password")}
          />
          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Sign in
          </Button>
        </form>
        <p className="mt-3 text-center text-sm">
          <Link to="/forgot-password" className="font-medium text-white/70 hover:text-white hover:underline">
            Forgot your password?
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-white/70">
          New student?{" "}
          <Link to="/register" className="font-medium text-white hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
