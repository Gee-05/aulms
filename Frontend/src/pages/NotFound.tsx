import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">404</h1>
      <p className="text-slate-500 dark:text-slate-400">This page doesn't exist.</p>
      <Link to="/" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        Go home
      </Link>
    </div>
  );
}
