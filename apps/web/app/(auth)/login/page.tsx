"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DEMO_ACCOUNTS = [
  { label: "Admin", username: "admin", password: "admin123" },
  { label: "Santri", username: "santri1", password: "santri123" },
  { label: "Wali", username: "wali1", password: "wali123" },
];

const HIGHLIGHTS = [
  { title: "Pengajuan digital", desc: "Izin keluar & pulang tanpa kertas, tercatat rapi." },
  { title: "Persetujuan cepat", desc: "Admin/Pengasuh menyetujui atau menolak dalam sekejap." },
  { title: "Notifikasi real-time", desc: "Santri & wali selalu tahu status izin terkini." },
];

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const [usernameOrEmail, setUsernameOrEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const dismissToast = () => setError(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await apiFetch<{ access_token: string; user: unknown }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ usernameOrEmail: usernameOrEmail.trim(), password }),
        },
      );
      setToken(res.access_token);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login gagal";
      const lower = message.toLowerCase();
      if (
        lower.includes("network") ||
        lower.includes("fetch") ||
        lower.includes("load failed") ||
        lower.includes("econnrefused") ||
        lower.includes("connection refused")
      ) {
        setError("Tidak dapat terhubung ke server. Pastikan API jalan di http://localhost:3001 lalu coba lagi.");
      } else if (lower.includes("unauthorized") || lower.includes("invalid") || lower.includes("credential")) {
        setError("Username/email atau password salah. Silakan coba lagi.");
        setFieldErrors({ password: "Kredensial tidak valid" });
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(username: string, pwd: string) {
    setUsernameOrEmail(username);
    setPassword(pwd);
    setError(null);
    setFieldErrors({});
  }

  return (
    <div className="flex min-h-screen w-full">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-gradient p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-pattern-geometric" aria-hidden="true" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl animate-float-slow" />
          <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl animate-float-medium" />
          <div className="absolute top-20 right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl animate-float-fast" />
        </div>
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold backdrop-blur">
            S
          </span>
          <div>
            <p className="text-lg font-bold leading-tight">SantriPermit</p>
            <p className="text-xs text-white/70">Sistem Perizinan Santri</p>
          </div>
        </div>
        <div className="relative space-y-6">
          <h2 className="max-w-md text-3xl font-bold leading-tight">
            Perizinan santri yang tertib, transparan, dan tercatat.
          </h2>
          <ul className="space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm">
                  ✓
                </span>
                <div>
                  <p className="text-sm font-semibold">{h.title}</p>
                  <p className="text-sm text-white/70">{h.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/60">Pondok Pesantren • Digital Permission Management</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-4 sm:p-8">
        <Card className="w-full max-w-sm animate-fade-up shadow-pop border-primary/10 backdrop-blur-sm bg-card/95">
          <CardHeader>
            <div className="mb-1 flex items-center gap-2 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-white">
                S
              </span>
              <span className="font-semibold">SantriPermit</span>
            </div>
            <CardTitle className="text-2xl">Selamat datang kembali</CardTitle>
            <CardDescription>Masuk untuk melanjutkan</CardDescription>
          </CardHeader>
          <CardContent>
            {registered && !error && (
              <div
                className="mb-4 flex items-start gap-3 rounded-lg bg-emerald-50 p-3 animate-fade-in dark:bg-emerald-950/40"
                role="status"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Pendaftaran berhasil, silakan masuk dengan akun barumu.
                  </p>
                </div>
              </div>
            )}
            {error && (
              <div
                key={error}
                className="mb-4 flex items-start gap-3 rounded-lg bg-danger-soft p-3 animate-fade-in"
                role="alert"
              >
                <svg className="mt-0.5 flex-shrink-0 h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={dismissToast}
                  className="flex-shrink-0 rounded p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  aria-label="Tutup notifikasi"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Input
                  id="usernameOrEmail"
                  label="Username atau Email"
                  value={usernameOrEmail}
                  onChange={(e) => {
                    setUsernameOrEmail(e.target.value);
                    clearFieldError("usernameOrEmail");
                  }}
                  onBlur={() => clearFieldError("usernameOrEmail")}
                  placeholder=" "
                  autoComplete="username"
                  required
                  invalid={!!fieldErrors.usernameOrEmail}
                  aria-describedby={fieldErrors.usernameOrEmail ? "usernameOrEmail-error" : undefined}
                />
                {fieldErrors.usernameOrEmail && (
                  <p id="usernameOrEmail-error" className="text-sm text-red-600 dark:text-red-400 animate-fade-in" role="alert">
                    {fieldErrors.usernameOrEmail}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="relative">
                  <Input
                    id="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError("password");
                    }}
                    onBlur={() => clearFieldError("password")}
                    placeholder=" "
                    autoComplete="current-password"
                    required
                    className="pr-14"
                    invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="password-error" className="text-sm text-red-600 dark:text-red-400 animate-fade-in" role="alert">
                    {fieldErrors.password}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" loading={loading} disabled={loading}>
                {loading ? "Memproses..." : "Login"}
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Daftar
              </Link>
            </p>
            <div className="mt-5 rounded-xl border border-border bg-muted/60 p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Akun demo — klik untuk isi otomatis:</p>
              <div className="flex flex-wrap gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.username}
                    type="button"
                    onClick={() => fillDemo(a.username, a.password)}
                    className={cn(
                      "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium shadow-sm transition-all duration-150 hover:shadow-card hover:border-primary hover:scale-105",
                      usernameOrEmail === a.username && "border-primary ring-1 ring-primary/40",
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
