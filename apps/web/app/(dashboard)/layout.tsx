"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Header } from "@/components/header";

type Me = { id: string; role: string; username?: string; santriId?: string };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = React.useState<Me | null>(null);
  const [loading, setLoading] = React.useState(true);

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

  return (
    <div className="flex min-h-screen flex-col">
      <Header me={me} />
      <div className="flex flex-1">
        <aside className="w-56 border-r bg-card p-4">
          <nav className="flex flex-col gap-1">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  className={`rounded px-3 py-2 text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 bg-zinc-50 p-6 dark:bg-black">{children}</main>
      </div>
    </div>
  );
}
