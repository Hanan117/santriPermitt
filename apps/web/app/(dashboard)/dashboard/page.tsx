"use client";

import * as React from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Permission = {
  id: string;
  status: string;
  tujuan?: string;
  jenisIzin?: string;
  createdAt?: string;
  santri?: { nama?: string };
};

type Me = { role?: string; santriId?: string | null; linked?: boolean };

function Icon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export default function DashboardPage() {
  const [list, setList] = React.useState<Permission[]>([]);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isWali, setIsWali] = React.useState(false);
  const [unlinked, setUnlinked] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      Promise.all([
        apiFetch<{ data: Permission[] } | Permission[]>("/permissions?limit=100"),
        apiFetch<Me>("/auth/me").catch(() => null),
      ])
        .then(([res, me]) => {
          const items: Permission[] = Array.isArray(res) ? res : (res.data ?? []);
          setList(items);
          setIsAdmin(me?.role === "ADMIN");
          setIsWali(me?.role === "WALI");
          setUnlinked(me?.role === "ADMIN" ? false : me?.linked === undefined ? !me?.santriId : !me.linked);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat dashboard"))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const menunggu = list.filter((p) => p.status === "MENUNGGU");
  const disetujui = list.filter((p) => p.status === "DISETUJUI");

  const weekAgo = startOfDay(new Date()).getTime() - 6 * 86400000;
  const weekCounts = Array.from({ length: 7 }, (_, i) => {
    const dayStart = weekAgo + i * 86400000;
    const dayEnd = dayStart + 86400000;
    const n = list.filter((p) => {
      const t = p.createdAt ? new Date(p.createdAt).getTime() : NaN;
      return !Number.isNaN(t) && t >= dayStart && t < dayEnd;
    }).length;
    const label = DAY_LABELS[(new Date(dayStart).getDay() + 7) % 7];
    return { label, n };
  });
  const weekTotal = weekCounts.reduce((a, b) => a + b.n, 0);
  const maxBar = Math.max(1, ...weekCounts.map((w) => w.n));
  const attention = menunggu.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <SkeletonRows rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {isWali && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Akun wali hanya untuk memantau. Pengajuan izin dilakukan oleh santri dari akunnya.
          </CardContent>
        </Card>
      )}
      {unlinked && (
        <Card className="border-warning/40">
          <CardContent className="p-4 text-sm">
            <p className="font-semibold">Akun belum terverifikasi admin.</p>
            <p className="text-muted-foreground">
              Akunmu belum tertaut ke data santri. Hubungi admin pondok agar akunmu di-ACC, setelah itu kamu bisa mengajukan (santri) atau memantau (wali).
            </p>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Menunggu persetujuan"
          value={menunggu.length}
          hint={isAdmin ? "Perlu tindakan Anda" : "Menunggu diproses admin"}
          tone="warning"
          icon={<Icon d="M12 6v6l4 2M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />}
        />
        <StatCard
          label="Disetujui"
          value={disetujui.length}
          hint={`${weekTotal} pengajuan 7 hari terakhir`}
          tone="success"
          icon={<Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />}
        />
        <StatCard
          label="Total riwayat"
          value={list.length}
          tone="primary"
          icon={<Icon d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Pengajuan 7 hari terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            {weekTotal === 0 ? (
              <EmptyState title="Belum ada pengajuan minggu ini" description="Grafik akan terisi saat ada izin baru." />
            ) : (
              <div className="flex h-40 items-end gap-2 sm:gap-3" role="img" aria-label={`Total ${weekTotal} pengajuan 7 hari terakhir`}>
                {weekCounts.map((w, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">{w.n}</span>
                    <div
                      className="w-full rounded-t-lg bg-brand-gradient transition-all duration-300"
                      style={{ height: `${Math.max(6, (w.n / maxBar) * 100)}%` }}
                    />
                    <span className="text-[11px] text-muted-foreground">{w.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Perlu perhatian</CardTitle>
            <Badge variant="warning" dot>{menunggu.length} menunggu</Badge>
          </CardHeader>
          <CardContent>
            {attention.length === 0 ? (
              <EmptyState
                icon="✓"
                title="Semua beres"
                description="Tidak ada izin yang menunggu persetujuan."
              />
            ) : (
              <div className="space-y-2">
                {attention.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-card-hover">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.santri?.nama ?? "-"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.jenisIzin ?? ""} • {p.tujuan ?? "-"}
                      </p>
                    </div>
                    <Badge variant="warning" dot className="shrink-0">Menunggu</Badge>
                  </div>
                ))}
                <Link href={isAdmin ? "/admin/perizinan" : "/izin/riwayat"} className="block pt-1">
                  <Button variant="outline" size="sm" className="w-full">
                    {isAdmin ? "Kelola perizinan" : "Lihat riwayat"}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
