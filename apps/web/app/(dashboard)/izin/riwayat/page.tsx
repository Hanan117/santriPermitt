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
  tanggalKeluar?: string;
  tanggalKembali?: string;
};

function statusVariant(s: string): "warning" | "success" | "danger" | "default" {
  if (s === "MENUNGGU") return "warning";
  if (s === "DISETUJUI") return "success";
  if (s === "DITOLAK") return "danger";
  return "default";
}

export default function RiwayatPage() {
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);
  const [data, setData] = React.useState<Permission[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Permission | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) qs.set("status", status);
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
  }, [page, status, limit]);

  React.useEffect(() => {
    const t = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Riwayat Izin</CardTitle>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border px-3 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="MENUNGGU">MENUNGGU</option>
            <option value="DISETUJUI">DISETUJUI</option>
            <option value="DITOLAK">DITOLAK</option>
          </select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Memuat...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Jenis</th>
                    <th className="p-2">Tujuan</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Tanggal</th>
                    <th className="p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">{p.jenisIzin ?? "-"}</td>
                      <td className="p-2">{p.tujuan ?? "-"}</td>
                      <td className="p-2">
                        <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                      </td>
                      <td className="p-2">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}</td>
                      <td className="p-2">
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-lg bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">Detail Izin</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Status:</span> <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
              </p>
              <p>
                <span className="font-medium">Jenis:</span> {selected.jenisIzin ?? "-"}
              </p>
              <p>
                <span className="font-medium">Tujuan:</span> {selected.tujuan ?? "-"}
              </p>
              <p>
                <span className="font-medium">Alasan:</span> {selected.alasan ?? "-"}
              </p>
              <p>
                <span className="font-medium">Keluar:</span> {selected.tanggalKeluar ?? "-"}
              </p>
              <p>
                <span className="font-medium">Kembali:</span> {selected.tanggalKembali ?? "-"}
              </p>
            </div>
            <Button className="mt-4 w-full" variant="outline" onClick={() => setSelected(null)}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
