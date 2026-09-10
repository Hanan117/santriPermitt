"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const jenisOptions = ["KELUAR", "PULANG"] as const;

export default function AjukanPage() {
  const router = useRouter();
  const [form, setForm] = React.useState({
    jenisIzin: "KELUAR",
    tujuan: "",
    alasan: "",
    keterangan: "",
    tanggalKeluar: "",
    tanggalKembali: "",
    jamKeluar: "",
    jamKembali: "",
    santriId: "",
  });
  const [me, setMe] = React.useState<{ role?: string; santriId?: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    apiFetch<{ role: string; santriId?: string }>("/auth/me")
      .then(setMe)
      .catch(() => {});
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.tujuan.trim() || !form.alasan.trim()) {
      setError("Tujuan dan alasan wajib diisi");
      return;
    }
    if (!form.tanggalKeluar || !form.tanggalKembali) {
      setError("Tanggal keluar dan kembali wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        jenisIzin: form.jenisIzin,
        tujuan: form.tujuan,
        alasan: form.alasan,
        keterangan: form.keterangan,
        tanggalKeluar: form.tanggalKeluar,
        tanggalKembali: form.tanggalKembali,
        jamKeluar: form.jamKeluar,
        jamKembali: form.jamKembali,
      };
      // Include santriId from me or manual input for admin
      const santriId = me?.santriId ?? form.santriId;
      if (santriId) payload.santriId = santriId;

      await apiFetch("/permissions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push("/izin/riwayat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengajukan izin");
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = me?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Ajukan Izin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jenis Izin</label>
              <select
                value={form.jenisIzin}
                onChange={(e) => update("jenisIzin", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {jenisOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Santri ID (Admin)</label>
                <Input value={form.santriId} onChange={(e) => update("santriId", e.target.value)} placeholder="santriId" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tujuan</label>
              <Input value={form.tujuan} onChange={(e) => update("tujuan", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Alasan</label>
              <Input value={form.alasan} onChange={(e) => update("alasan", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Keterangan</label>
              <Input value={form.keterangan} onChange={(e) => update("keterangan", e.target.value)} placeholder="opsional" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Keluar</label>
                <Input type="date" value={form.tanggalKeluar} onChange={(e) => update("tanggalKeluar", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Kembali</label>
                <Input type="date" value={form.tanggalKembali} onChange={(e) => update("tanggalKembali", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jam Keluar</label>
                <Input type="time" value={form.jamKeluar} onChange={(e) => update("jamKeluar", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jam Kembali</label>
                <Input type="time" value={form.jamKembali} onChange={(e) => update("jamKembali", e.target.value)} />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Mengirim..." : "Ajukan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
