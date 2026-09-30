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
  createdAt?: string;
  santri?: { nama?: string; nis?: string };
  santriId?: string;
};

function statusVariant(s: string): "warning" | "success" | "danger" | "default" {
  if (s === "MENUNGGU") return "warning";
  if (s === "DISETUJUI") return "success";
  if (s === "DITOLAK") return "danger";
  return "default";
}

export default function AdminPerizinanPage() {
  const [status, setStatus] = React.useState("");
  const [jenis, setJenis] = React.useState("");
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [dari, setDari] = React.useState("");
  const [sampai, setSampai] = React.useState("");
  const [page, setPage] = React.useState(1);
  const limit = 10;
  const [data, setData] = React.useState<Permission[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [rejectId, setRejectId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) qs.set("status", status);
      if (jenis) qs.set("jenisIzin", jenis);
      if (debouncedQ.trim()) qs.set("search", debouncedQ.trim());
      if (dari) qs.set("tanggalDari", dari);
      if (sampai) qs.set("tanggalSampai", sampai);
      const res = await apiFetch<{ data: Permission[]; total?: number } | Permission[]>(`/permissions?${qs}`);
      if (Array.isArray(res)) { setData(res); setTotal(res.length); }
      else { setData(res.data ?? []); setTotal(res.total ?? res.data?.length ?? 0); }
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat data"); }
    finally { setLoading(false); }
  }, [page, status, jenis, debouncedQ, dari, sampai]);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  React.useEffect(() => {
    const t = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(t);
  }, [fetchData]);
  React.useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const shown = data;

  async function approve(id: string) {
    setActionLoading(id);
    try {
      await apiFetch(`/permissions/${id}/approve`, { method: "PATCH" });
      setToast("Izin disetujui");
      fetchData();
    } catch (e) { setToast(e instanceof Error ? e.message : "Gagal approve"); }
    finally { setActionLoading(null); }
  }
  async function reject(id: string) {
    if (!rejectReason.trim()) { setToast("Alasan wajib diisi"); return; }
    setActionLoading(id);
    try {
      await apiFetch(`/permissions/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason: rejectReason }) });
      setToast("Izin ditolak");
      setRejectId(null); setRejectReason("");
      fetchData();
    } catch (e) { setToast(e instanceof Error ? e.message : "Gagal reject"); }
    finally { setActionLoading(null); }
  }

  function resetFilters() {
    setStatus(""); setJenis(""); setQ(""); setDebouncedQ(""); setDari(""); setSampai(""); setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="space-y-4">
      {toast && <div className="rounded-xl bg-success px-4 py-2.5 text-sm font-medium text-white shadow-card animate-fade-up">{toast}</div>}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admin - Perizinan</CardTitle>
          <Badge variant="warning" dot>{total} data</Badge>
        </CardHeader>
        <CardContent>
          <div className="sticky top-14 z-10 -mx-1 mb-4 flex flex-col gap-2 bg-card/95 px-1 py-2 backdrop-blur sm:flex-row">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama, NIS, tujuan..."
              className="sm:max-w-xs"
              aria-label="Cari perizinan"
            />
            <div className="flex gap-2">
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-border bg-card px-3 text-sm" aria-label="Filter status">
                <option value="">Semua Status</option>
                <option value="MENUNGGU">MENUNGGU</option>
                <option value="DISETUJUI">DISETUJUI</option>
                <option value="DITOLAK">DITOLAK</option>
              </select>
              <select value={jenis} onChange={(e) => { setJenis(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-border bg-card px-3 text-sm" aria-label="Filter jenis">
                <option value="">Semua Jenis</option>
                <option value="KELUAR">KELUAR</option>
                <option value="PULANG">PULANG</option>
              </select>
              <Input
                type="date"
                value={dari}
                onChange={(e) => { setDari(e.target.value); setPage(1); }}
                aria-label="Dari tanggal"
                className="sm:max-w-44"
              />
              <Input
                type="date"
                value={sampai}
                onChange={(e) => { setSampai(e.target.value); setPage(1); }}
                aria-label="Sampai tanggal"
                className="sm:max-w-44"
              />
              {(status || jenis || q || dari || sampai) && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-10">
                  Reset
                </Button>
              )}
            </div>
          </div>
          {loading ? <SkeletonRows rows={6} /> : error ? (
            <EmptyState icon="⚠" title="Gagal memuat data" description={error} action={<Button size="sm" onClick={fetchData}>Coba lagi</Button>} />
          ) : shown.length === 0 ? (
            <EmptyState icon="📋" title="Tidak ada data" description="Belum ada pengajuan izin yang cocok dengan filter." />
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
                      <td className="p-2.5">
                        <p className="font-medium">{p.santri?.nama ?? p.santriId ?? "-"}</p>
                        {p.santri?.nis && <p className="text-xs text-muted-foreground">{p.santri.nis}</p>}
                      </td>
                      <td className="p-2.5">{p.jenisIzin ?? "-"}</td>
                      <td className="p-2.5 max-w-48 truncate">{p.tujuan ?? "-"}</td>
                      <td className="p-2.5"><Badge variant={statusVariant(p.status)} dot>{p.status}</Badge></td>
                      <td className="p-2.5 whitespace-nowrap">{p.createdAt ? new Date(p.createdAt).toLocaleDateString("id-ID") : "-"}</td>
                      <td className="p-2.5">
                        {p.status === "MENUNGGU" ? (
                          <div className="flex gap-1.5">
                            <Button size="sm" loading={actionLoading === p.id} onClick={() => approve(p.id)}>Setujui</Button>
                            <Button size="sm" variant="outline" onClick={() => { setRejectId(p.id); setRejectReason(""); }}>Tolak</Button>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Halaman {page} dari {totalPages} — {total} data</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Modal
        open={rejectId !== null}
        onClose={() => setRejectId(null)}
        title="Tolak Izin"
        description="Alasan penolakan wajib diisi dan akan diteruskan ke santri."
        footer={
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setRejectId(null)}>Batal</Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={actionLoading === rejectId}
              onClick={() => rejectId && reject(rejectId)}
            >
              Tolak
            </Button>
          </div>
        }
      >
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Alasan penolakan"
          rows={3}
          className="min-h-20 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        />
      </Modal>
    </div>
  );
}
