"use client";
import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      const res = await apiFetch<{ data: Permission[]; total?: number } | Permission[]>(`/permissions?${qs}`);
      if (Array.isArray(res)) { setData(res); setTotal(res.length); }
      else { setData(res.data ?? []); setTotal(res.total ?? res.data?.length ?? 0); }
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat data"); }
    finally { setLoading(false); }
  }, [page, status]);

  React.useEffect(() => {
    const t = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(t);
  }, [fetchData]);
  React.useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

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

  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="space-y-4">
      {toast && <div className="rounded bg-green-600 px-4 py-2 text-sm text-white">{toast}</div>}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admin - Perizinan</CardTitle>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-9 rounded-md border px-3 text-sm">
            <option value="">Semua Status</option>
            <option value="MENUNGGU">MENUNGGU</option>
            <option value="DISETUJUI">DISETUJUI</option>
            <option value="DITOLAK">DITOLAK</option>
          </select>
        </CardHeader>
        <CardContent>
          {loading ? <p>Memuat...</p> : error ? <p className="text-sm text-red-600">{error}</p> : data.length === 0 ? <p className="text-sm text-muted-foreground">Tidak ada data</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="p-2">Santri</th><th className="p-2">Jenis</th><th className="p-2">Tujuan</th><th className="p-2">Status</th><th className="p-2">Tanggal</th><th className="p-2">Aksi</th></tr></thead>
                <tbody>
                  {data.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">{p.santri?.nama ?? p.santriId ?? "-"}</td>
                      <td className="p-2">{p.jenisIzin ?? "-"}</td>
                      <td className="p-2">{p.tujuan ?? "-"}</td>
                      <td className="p-2"><Badge variant={statusVariant(p.status)}>{p.status}</Badge></td>
                      <td className="p-2">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}</td>
                      <td className="p-2">
                        {p.status === "MENUNGGU" ? (
                          <div className="flex gap-1">
                            <Button size="sm" disabled={actionLoading === p.id} onClick={() => approve(p.id)}>Setujui</Button>
                            <Button size="sm" variant="outline" onClick={() => setRejectId(p.id)}>Tolak</Button>
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
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRejectId(null)}>
          <div className="w-full max-w-md rounded-lg bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-semibold">Tolak Izin</h3>
            <p className="mb-2 text-sm text-muted-foreground">Alasan penolakan wajib diisi</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Alasan penolakan" className="min-h-20 w-full rounded-md border px-3 py-2 text-sm" />
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejectId(null)}>Batal</Button>
              <Button className="flex-1" disabled={actionLoading === rejectId} onClick={() => reject(rejectId)}>Tolak</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
