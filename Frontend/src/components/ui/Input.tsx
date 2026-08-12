import { forwardRef, useState } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { IconEye, IconEyeOff } from "../icons";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  labelClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", labelClassName, id, type, ...props }, ref) => {
    const inputId = id ?? props.name;
    const isPassword = type === "password";
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className={labelClassName ?? "text-sm font-medium text-slate-700 dark:text-slate-200"}>
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (visible ? "text" : "password") : type}
            className={`w-full rounded-md border-0 px-3 py-2 text-sm text-slate-900 shadow-sm bg-white/90 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-800/90 dark:text-slate-100 dark:ring-slate-600 ${isPassword ? "pr-10" : ""} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setVisible((prev) => !prev)}
              aria-label={visible ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              {visible ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      </div>
    );
  },
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`rounded-md border-0 px-3 py-2 text-sm text-slate-900 shadow-sm bg-white/90 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-800/90 dark:text-slate-100 dark:ring-slate-600 ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  labelClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", labelClassName, id, children, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className={labelClassName ?? "text-sm font-medium text-slate-700 dark:text-slate-200"}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={`rounded-md border-0 px-3 py-2 text-sm text-slate-900 shadow-sm bg-white/90 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-800/90 dark:text-slate-100 dark:ring-slate-600 ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      </div>
    );
  },
);
Select.displayName = "Select";
