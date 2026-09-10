"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";

type Me = { id: string; role: string; username?: string; santriId?: string };

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const ICONS: Record<string, string> = {
  "/dashboard": "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  "/izin/ajukan": "M12 5v14M5 12h14",
  "/izin/riwayat": "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2",
  "/admin/perizinan": "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  "/admin/santri": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
};

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/izin/ajukan": "Ajukan Izin",
  "/izin/riwayat": "Riwayat Izin",
  "/admin/perizinan": "Kelola Perizinan",
  "/admin/santri": "Data Santri",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = React.useState<Me | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [drawer, setDrawer] = React.useState(false);

  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("santripermit_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    apiFetch<Me>("/auth/me")
      .then(setMe)
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Memuat...</div>;
  }

  const isAdmin = me?.role === "ADMIN";

  const links: { href: string; label: string }[] = [{ href: "/dashboard", label: "Dashboard" }];
  if (isAdmin) {
    links.push({ href: "/admin/perizinan", label: "Perizinan" });
    links.push({ href: "/admin/santri", label: "Santri" });
  } else {
    // SANTRI, WALI, atau role tak dikenal: alur pengajuan izin.
    // Otorisasi sesungguhnya ditegakkan di API; ini hanya menu.
    links.push({ href: "/izin/ajukan", label: "Ajukan Izin" });
    links.push({ href: "/izin/riwayat", label: "Riwayat" });
  }

  const title = TITLES[pathname] ?? "SantriPermit";

  const nav = (
    <nav className="flex flex-col gap-1" onClick={() => setDrawer(false)}>
      {links.map((l) => {
        const active = pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(l.href + "/"));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              active ? "bg-primary/10 text-secondary dark:text-emerald-300" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-brand-gradient transition-all duration-150",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon d={ICONS[l.href] ?? ICONS["/dashboard"]} className="h-5 w-5 shrink-0" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header me={me} />
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-card p-4 md:block">
          {nav}
        </aside>
        {drawer && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
            <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setDrawer(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-card p-4 shadow-pop animate-fade-up">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setDrawer(false)} aria-label="Tutup menu" className="rounded-lg p-2 hover:bg-muted">
                  ✕
                </button>
              </div>
              {nav}
            </div>
          </div>
        )}
        <main className="min-w-0 flex-1 bg-zinc-50 p-4 dark:bg-black sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Buka menu"
              className="rounded-lg border border-border bg-card p-2 shadow-card md:hidden"
            >
              <Icon d="M4 6h16M4 12h16M4 18h16" className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold sm:text-2xl">{title}</h1>
              <p className="truncate text-xs text-muted-foreground">
                SantriPermit <span aria-hidden="true">/</span> {title}
              </p>
            </div>
          </div>
          <div key={pathname} className="animate-fade-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
