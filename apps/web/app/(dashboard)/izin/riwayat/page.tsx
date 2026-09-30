"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

type Permission = {
  id: string;
  status: string;
  jenisIzin?: string;
  tujuan?: string;
  alasan?: string;
  keterangan?: string;
  createdAt?: string;
  tanggalKeluar?: string;
  tanggalKembali?: string;
  jamKeluar?: string;
  jamKembali?: string;
  rejectionReason?: string;
  santri?: { nama?: string };
};

function statusVariant(s: string): "warning" | "success" | "danger" | "default" {
  if (s === "MENUNGGU") return "warning";
  if (s === "DISETUJUI") return "success";
  if (s === "DITOLAK") return "danger";
  return "default";
}

export default function RiwayatPage() {
  const [status, setStatus] = React.useState("");
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);
  const [data, setData] = React.useState<Permission[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Permission | null>(null);
  // Deep-link dari dashboard wali: /izin/riwayat?santriId=...
  const [santriFilter] = React.useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("santriId") ?? "" : "",
  );

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) qs.set("status", status);
      if (santriFilter) qs.set("santriId", santriFilter);
      const res = await apiFetch<{ data: Permission[]; total?: number; meta?: { total: number } } | Permission[]>(
        `/permissions?${qs.toString()}`,
      );
      if (Array.isArray(res)) {
        setData(res);
        setTotal(res.length);
      } else {
        setData(res.data ?? []);
        setTotal(res.total ?? res.meta?.total ?? (res.data?.length ?? 0));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat riwayat");
    } finally {
      setLoading(false);
    }
  }, [page, status, limit, santriFilter]);

  React.useEffect(() => {
    const t = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  const query = q.trim().toLowerCase();
  const shown = query
    ? data.filter((p) =>
        (p.tujuan ?? "").toLowerCase().includes(query) ||
        (p.jenisIzin ?? "").toLowerCase().includes(query) ||
        (p.alasan ?? "").toLowerCase().includes(query),
      )
    : data;

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Riwayat Izin{santriFilter ? " (1 santri)" : ""}</CardTitle>
          <Badge variant="info">{total} pengajuan</Badge>
        </CardHeader>
        <CardContent>
          <div className="sticky top-14 z-10 -mx-1 mb-4 flex flex-col gap-2 bg-card/95 px-1 py-2 backdrop-blur sm:flex-row">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari tujuan, jenis, alasan..."
              className="sm:max-w-xs"
              aria-label="Cari riwayat"
            />
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-border bg-card px-3 text-sm" aria-label="Filter status">
              <option value="">Semua Status</option>
              <option value="MENUNGGU">MENUNGGU</option>
              <option value="DISETUJUI">DISETUJUI</option>
              <option value="DITOLAK">DITOLAK</option>
            </select>
          </div>
          {loading ? <SkeletonRows rows={6} /> : error ? (
            <EmptyState icon="⚠" title="Gagal memuat data" description={error} action={<Button size="sm" onClick={fetchData}>Coba lagi</Button>} />
          ) : shown.length === 0 ? (
            <EmptyState
              icon="📝"
              title={query ? "Tidak ada hasil" : "Belum ada pengajuan"}
              description={query ? `Tidak ada yang cocok dengan "${q}".` : "Ajukan izin pertama lewat halaman Ajukan Izin."}
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-left">
                    <th className="p-2.5 font-semibold">Santri</th>
                    <th className="p-2.5 font-semibold">Jenis</th>
                    <th className="p-2.5 font-semibold">Tujuan</th>
                    <th className="p-2.5 font-semibold">Status</th>
                    <th className="p-2.5 font-semibold">Tanggal</th>
                    <th className="p-2.5 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p) => (
                    <tr key={p.id} className="border-b border-border transition-colors last:border-0 hover:bg-card-hover">
                      <td className="p-2.5 font-medium">{p.santri?.nama ?? "-"}</td>
                      <td className="p-2.5">{p.jenisIzin ?? "-"}</td>
                      <td className="p-2.5 max-w-48 truncate">{p.tujuan ?? "-"}</td>
                      <td className="p-2.5">
                        <Badge variant={statusVariant(p.status)} dot>{p.status}</Badge>
                      </td>
                      <td className="p-2.5 whitespace-nowrap">{p.createdAt ? new Date(p.createdAt).toLocaleDateString("id-ID") : "-"}</td>
                      <td className="p-2.5">
                        <Button size="sm" variant="outline" onClick={() => setSelected(p)}>
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages} — {total} data
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Detail Izin"
        footer={null}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge variant={statusVariant(selected.status)} dot>{selected.status}</Badge>
            </div>
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5">
              <dt className="text-muted-foreground">Santri</dt><dd className="font-medium">{selected.santri?.nama ?? "-"}</dd>
              <dt className="text-muted-foreground">Jenis</dt><dd className="font-medium">{selected.jenisIzin ?? "-"}</dd>
              <dt className="text-muted-foreground">Tujuan</dt><dd className="font-medium">{selected.tujuan ?? "-"}</dd>
              <dt className="text-muted-foreground">Alasan</dt><dd>{selected.alasan ?? "-"}</dd>
              {selected.keterangan && (<><dt className="text-muted-foreground">Keterangan</dt><dd>{selected.keterangan}</dd></>)}
              <dt className="text-muted-foreground">Keluar</dt>
              <dd>{selected.tanggalKeluar ?? "-"}{selected.jamKeluar ? ` • ${selected.jamKeluar}` : ""}</dd>
              <dt className="text-muted-foreground">Kembali</dt>
              <dd>{selected.tanggalKembali ?? "-"}{selected.jamKembali ? ` • ${selected.jamKembali}` : ""}</dd>
              {selected.rejectionReason && (<><dt className="text-muted-foreground">Alasan tolak</dt><dd className="text-red-600">{selected.rejectionReason}</dd></>)}
            </dl>
            <Button className="w-full" variant="outline" onClick={() => setSelected(null)}>
              Tutup
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
