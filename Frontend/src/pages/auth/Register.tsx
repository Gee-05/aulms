import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { register as apiRegister } from "../../api/auth";
import { extractErrorMessage } from "../../api/client";
import Button from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";

const schema = z
  .object({
    username: z.string().min(3, "At least 3 characters"),
    email: z.string().email("Enter a valid email"),
    first_name: z.string().min(1, "Required"),
    last_name: z.string().min(1, "Required"),
    phone_number: z.string().optional(),
    membership_type: z.enum(["student", "faculty", "guest"]),
    password: z.string().min(8, "At least 8 characters"),
    password2: z.string().min(8, "At least 8 characters"),
  })
  .refine((data) => data.password === data.password2, {
    message: "Passwords do not match",
    path: ["password2"],
  });

type FormValues = z.infer<typeof schema>;

const GLASS_INPUT = "border-white/20 bg-white/90 placeholder:text-slate-400";
const GLASS_LABEL = "text-sm font-medium text-white/90";

export default function Register() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { membership_type: "student" } });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await apiRegister(values);
      toast.success("Registration successful. You can now log in.");
      navigate("/login");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass-auth-card w-full max-w-md p-8">
        <h1 className="mb-1 text-center text-2xl font-bold text-white drop-shadow-sm">Create your account</h1>
        <p className="mb-6 text-center text-sm text-white/70">
          Join the AULMS Library as a student, faculty member, or guest patron.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              error={errors.first_name?.message}
              className={GLASS_INPUT}
              labelClassName={GLASS_LABEL}
              {...register("first_name")}
            />
            <Input
              label="Last name"
              error={errors.last_name?.message}
              className={GLASS_INPUT}
              labelClassName={GLASS_LABEL}
              {...register("last_name")}
            />
          </div>
          <Input
            label="Username"
            error={errors.username?.message}
            className={GLASS_INPUT}
            labelClassName={GLASS_LABEL}
            {...register("username")}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            className={GLASS_INPUT}
            labelClassName={GLASS_LABEL}
            {...register("email")}
          />
          <Input
            label="Phone number"
            error={errors.phone_number?.message}
            className={GLASS_INPUT}
            labelClassName={GLASS_LABEL}
            {...register("phone_number")}
          />
          <Select
            label="I am a..."
            error={errors.membership_type?.message}
            className={GLASS_INPUT}
            labelClassName={GLASS_LABEL}
            {...register("membership_type")}
          >
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="guest">Guest</option>
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              error={errors.password?.message}
              className={GLASS_INPUT}
              labelClassName={GLASS_LABEL}
              {...register("password")}
            />
            <Input
              label="Confirm password"
              type="password"
              error={errors.password2?.message}
              className={GLASS_INPUT}
              labelClassName={GLASS_LABEL}
              {...register("password2")}
            />
          </div>
          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Create account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-white/70">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
