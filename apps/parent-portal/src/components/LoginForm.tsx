"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useParentAuth } from "@/lib/auth-store";

type LoginFormProps = {
  schoolName: string;
};

export function LoginForm({ schoolName }: LoginFormProps) {
  const router = useRouter();
  const login = useParentAuth((s) => s.login);
  const [email, setEmail] = useState("fatima.khan@email.com");
  const [password, setPassword] = useState("parent123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const ok = await login({ email, password, parentName: "Fatima Khan" });
    setLoading(false);
    if (!ok) {
      setError("Enter email and password to continue.");
      return;
    }
    router.replace("/home");
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,106,61,0.12),_transparent_55%)]" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[420px]"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-xl font-bold text-white shadow-[0_10px_24px_-8px_rgba(255,106,61,0.55)]">
            {schoolName.slice(0, 1)}
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-heading">{schoolName}</h1>
          <p className="mt-1.5 text-sm text-muted">Sign in to your family account</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Email</span>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#E4E7EB] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                placeholder="you@email.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="mb-2 block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Password</span>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#E4E7EB] bg-white pl-10 pr-12 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <div className="mb-5 flex justify-end">
            <button type="button" className="text-xs font-semibold text-brand-600">
              Forgot password?
            </button>
          </div>

          {error && (
            <p className="mb-3 rounded-xl bg-soft-red px-3 py-2 text-xs font-medium text-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold text-white shadow-[0_8px_18px_-6px_rgba(255,106,61,0.55)] transition hover:bg-brand-600 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Signing in…" : "Log in"}
          </button>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-muted">
            Demo login · any email & password works
            <br />
            Stay connected to photos, check-ins, and classroom moments.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
