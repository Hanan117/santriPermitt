"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(username: string, pwd: string) {
    setUsernameOrEmail(username);
    setPassword(pwd);
    setError(null);
  }

  return (
    <div className="flex min-h-screen w-full">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-gradient p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-pattern-geometric" aria-hidden="true" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
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
        <Card className="w-full max-w-sm animate-fade-up">
          <CardHeader>
            <div className="mb-1 flex items-center gap-2 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-white">
                S
              </span>
              <span className="font-semibold">SantriPermit</span>
            </div>
            <CardTitle>Selamat datang kembali</CardTitle>
            <CardDescription>Masuk untuk melanjutkan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="usernameOrEmail" className="text-sm font-medium">
                  Username atau Email
                </label>
                <Input
                  id="usernameOrEmail"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="username / email"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? "Sembunyi" : "Lihat"}
                  </button>
                </div>
              </div>
              {error && (
                <p key={error} className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-red-700 animate-shake dark:text-red-300">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" loading={loading}>
                {loading ? "Memproses..." : "Login"}
              </Button>
            </form>
            <div className="mt-5 rounded-xl border border-border bg-muted/60 p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Akun demo — klik untuk isi otomatis:</p>
              <div className="flex flex-wrap gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.username}
                    type="button"
                    onClick={() => fillDemo(a.username, a.password)}
                    className={cn(
                      "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium shadow-sm transition-all hover:shadow-card hover:border-primary",
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
