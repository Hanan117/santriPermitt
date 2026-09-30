"use client";

import * as React from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

type Anak = {
  santriId: string;
  hubungan?: string;
  santri?: { id?: string; nama?: string; nis?: string; kelas?: string; kamar?: string; foto?: string | null };
};

type Permission = {
  id: string;
  status: string;
  jenisIzin?: string;
  tujuan?: string;
  tanggalKembali?: string;
  jamKembali?: string;
  createdAt?: string;
};

function statusVariant(s: string): "warning" | "success" | "danger" | "info" | "default" {
  if (s === "MENUNGGU") return "warning";
  if (s === "DISETUJUI") return "success";
  if (s === "DITOLAK") return "danger";
  if (s === "SEDANG_KELUAR") return "info";
  return "default";
}

function statusIzinLabel(s: string) {
  if (s === "MENUNGGU") return "Menunggu";
  if (s === "DISETUJUI") return "Disetujui";
  if (s === "DITOLAK") return "Ditolak";
  if (s === "SEDANG_KELUAR") return "Sedang keluar";
  if (s === "SUDAH_KEMBALI") return "Sudah kembali";
  return s;
}

/** Status kartu anak murni dari data izin existing — tanpa kolom DB baru. */
function ringkasanAnak(riwayat: Permission[]): { label: string; tone: "danger" | "warning" | "default"; keluar?: Permission } {
  const menunggu = riwayat.find((p) => p.status === "MENUNGGU");
  const now = new Date();
  const keluar = riwayat.find((p) => {
    if (p.status !== "DISETUJUI" && p.status !== "SEDANG_KELUAR") return false;
    if (!p.tanggalKembali) return true;
    const kembali = new Date(`${p.tanggalKembali}T${p.jamKembali ?? "23:59"}`);
    return Number.isNaN(kembali.getTime()) || kembali >= now;
  });
  if (keluar) return { label: "Sedang keluar", tone: "danger", keluar };
  if (menunggu) return { label: "Menunggu persetujuan", tone: "warning" };
  return { label: "Di pondok", tone: "default" };
}

function formatKembali(p: Permission) {
  if (!p.tanggalKembali) return "";
  const d = new Date(`${p.tanggalKembali}T${p.jamKembali ?? "00:00"}`);
  const tgl = Number.isNaN(d.getTime()) ? p.tanggalKembali : d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  return `${tgl}${p.jamKembali ? ` ${p.jamKembali}` : ""}`;
}

export default function WaliDashboardPage() {
  const [anak, setAnak] = React.useState<Anak[]>([]);
  const [riwayat, setRiwayat] = React.useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiFetch<Anak[] | { data?: Anak[] }>("/wali/anak-saya");
      const arr = Array.isArray(list) ? list : (list.data ?? []);
      setAnak(arr);
      const map: Record<string, Permission[]> = {};
      await Promise.all(
        arr.map(async (a) => {
          try {
            const res = await apiFetch<{ data: Permission[] } | Permission[]>(`/permissions?santriId=${a.santriId}&limit=3`);
            map[a.santriId] = Array.isArray(res) ? res : (res.data ?? []);
          } catch {
            map[a.santriId] = [];
          }
        }),
      );
      setRiwayat(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data anak");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <SkeletonRows rows={4} />;

  if (error) {
    return <EmptyState icon="⚠" title="Gagal memuat data" description={error} action={<Button size="sm" onClick={load}>Coba lagi</Button>} />;
  }

  if (anak.length === 0) {
    return (
      <EmptyState
        icon="👨‍👩‍👧"
        title="Belum ada anak tertaut"
        description="Akun belum ditautkan ke data santri, hubungi admin pondok."
      />
    );
  }

  const sedangKeluar = anak.filter((a) => ringkasanAnak(riwayat[a.santriId] ?? []).keluar).length;
  const menunggu = anak.filter((a) => (riwayat[a.santriId] ?? []).some((p) => p.status === "MENUNGGU")).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Ringkasan">
        {[
          { label: "Anak", value: anak.length },
          { label: "Sedang keluar", value: sedangKeluar },
          { label: "Menunggu", value: menunggu },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center sm:p-4">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {anak.map((a) => {
          const s = a.santri ?? {};
          const list = riwayat[a.santriId] ?? [];
          const ring = ringkasanAnak(list);
          return (
            <Card key={a.santriId}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white" aria-hidden="true">
                    {(s.nama ?? "?").trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.nama ?? "-"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[s.kelas, s.kamar ? `Kamar ${s.kamar}` : "", a.hubungan ? `· ${a.hubungan}` : ""].filter(Boolean).join(" ")}
                    </p>
                  </div>
                  <Badge variant={ring.tone} dot>{ring.label}</Badge>
                </div>

                {ring.keluar && (
                  <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-medium">
                    Kembali {formatKembali(ring.keluar)}{ring.keluar.tujuan ? ` · ${ring.keluar.tujuan}` : ""}
                  </p>
                )}

                <ul className="flex flex-col gap-1.5" aria-label={`Izin terakhir ${s.nama}`}>
                  {list.length === 0 && (
                    <li className="text-xs text-muted-foreground">Belum ada riwayat izin.</li>
                  )}
                  {list.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-muted-foreground">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : ""} · {p.jenisIzin ?? ""}
                        {p.tujuan ? ` · ${p.tujuan}` : ""}
                      </span>
                      <Badge variant={statusVariant(p.status)}>{statusIzinLabel(p.status)}</Badge>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/izin/riwayat?santriId=${a.santriId}`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Lihat semua riwayat {s.nama?.split(" ")[0] ?? ""} →
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
