"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { authPost, safeNextPath } from "@/lib/auth-client";

type Props = {
  /** Resolved from the domain server-side; null = this address is not a known school */
  schoolName: string | null;
  next?: string;
};

export function LoginForm({ schoolName, next }: Props) {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await authPost("/api/auth/login", { usernameOrEmail, password });
    if (!result.ok) {
      setLoading(false);
      setPassword("");
      setError(result.error);
      return;
    }
    // Full navigation so middleware and server layouts see the new session cookie.
    window.location.assign(safeNextPath(next));
  };

  const onForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await authPost("/api/auth/forgot-password", { email });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice(result.data.message ?? "Check your email for reset instructions.");
    setMode("login");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-xl font-bold text-white">
            {(schoolName ?? "K").slice(0, 1)}
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-heading">
            {schoolName ?? "School not found"}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {schoolName
              ? mode === "login"
                ? "Sign in to the staff portal"
                : "Reset your password"
              : "This address is not linked to a school. Check the link you were given."}
          </p>
        </div>

        {schoolName && (
          <form
            onSubmit={mode === "login" ? onLogin : onForgot}
            className="space-y-4 rounded-3xl bg-surface p-6 shadow-card sm:p-8"
            noValidate
          >
            {mode === "login" ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="usernameOrEmail">Username or email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input
                      id="usernameOrEmail"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      className="h-11 pl-9"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={254}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-9 pr-11"
                      autoComplete="current-password"
                      maxLength={256}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-heading"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-semibold text-brand-600 hover:underline"
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setNotice(null);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="email">Registered email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  autoComplete="email"
                  maxLength={254}
                  required
                  autoFocus
                />
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-xl bg-soft-red px-3 py-2 text-xs font-medium text-danger">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-xl bg-soft-green px-3 py-2 text-xs font-medium text-success">
                {notice}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={
                loading || (mode === "login" ? !usernameOrEmail.trim() || !password : !email.trim())
              }
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? (loading ? "Signing in…" : "Sign in") : "Send reset instructions"}
            </Button>

            {mode === "forgot" && (
              <button
                type="button"
                className="w-full text-center text-xs font-semibold text-muted hover:text-heading"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
              >
                Back to sign in
              </button>
            )}

            <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure session · signs out automatically when it expires
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
