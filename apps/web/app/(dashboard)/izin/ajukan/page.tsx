"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const jenisOptions = ["KELUAR", "PULANG"] as const;

type FieldErrors = Partial<Record<"tujuan" | "alasan" | "tanggal" | "jam", string>>;

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
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    apiFetch<{ role: string; santriId?: string }>("/auth/me")
      .then(setMe)
      .catch(() => {});
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (key !== "tujuan" && key !== "alasan") return prev;
      const next = { ...prev };
      delete next[key as "tujuan" | "alasan"];
      return next;
    });
  }

  function validate(): boolean {
    const e: FieldErrors = {};
    if (!form.tujuan.trim()) e.tujuan = "Tujuan wajib diisi";
    if (!form.alasan.trim()) e.alasan = "Alasan wajib diisi";
    if (!form.tanggalKeluar || !form.tanggalKembali) {
      e.tanggal = "Tanggal keluar dan kembali wajib diisi";
    } else if (form.tanggalKembali < form.tanggalKeluar) {
      e.tanggal = "Tanggal kembali tidak boleh sebelum tanggal keluar";
    }
    if (!form.jamKeluar || !form.jamKembali) e.jam = "Jam keluar dan kembali wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        jenisIzin: form.jenisIzin,
        tujuan: form.tujuan.trim(),
        alasan: form.alasan.trim(),
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
      setSubmitError(err instanceof Error ? err.message : "Gagal mengajukan izin");
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = me?.role === "ADMIN";

  return (
    <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Ajukan Izin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Jenis & Tujuan</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jenis Izin</label>
                  <div className="flex gap-2">
                    {jenisOptions.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => update("jenisIzin", o)}
                        aria-pressed={form.jenisIzin === o}
                        className={
                          form.jenisIzin === o
                            ? "flex-1 rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white shadow-card"
                            : "flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-card-hover"
                        }
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Santri ID (Admin)</label>
                    <Input value={form.santriId} onChange={(e) => update("santriId", e.target.value)} placeholder="santriId" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tujuan</label>
                <Input value={form.tujuan} onChange={(e) => update("tujuan", e.target.value)} placeholder="cth. Pulang ke rumah" invalid={!!errors.tujuan} />
                {errors.tujuan && <p className="text-xs text-red-600">{errors.tujuan}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Alasan</label>
                <Input value={form.alasan} onChange={(e) => update("alasan", e.target.value)} placeholder="cth. Menjenguk keluarga" invalid={!!errors.alasan} />
                {errors.alasan && <p className="text-xs text-red-600">{errors.alasan}</p>}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Jadwal</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tanggal Keluar</label>
                  <Input type="date" value={form.tanggalKeluar} onChange={(e) => update("tanggalKeluar", e.target.value)} invalid={!!errors.tanggal} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tanggal Kembali</label>
                  <Input type="date" value={form.tanggalKembali} onChange={(e) => update("tanggalKembali", e.target.value)} invalid={!!errors.tanggal} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jam Keluar</label>
                  <Input type="time" value={form.jamKeluar} onChange={(e) => update("jamKeluar", e.target.value)} invalid={!!errors.jam} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jam Kembali</label>
                  <Input type="time" value={form.jamKembali} onChange={(e) => update("jamKembali", e.target.value)} invalid={!!errors.jam} />
                </div>
              </div>
              {errors.tanggal && <p className="text-xs text-red-600">{errors.tanggal}</p>}
              {errors.jam && <p className="text-xs text-red-600">{errors.jam}</p>}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Keterangan</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Keterangan <span className="font-normal text-muted-foreground">(opsional)</span></label>
                <Input value={form.keterangan} onChange={(e) => update("keterangan", e.target.value)} placeholder="Info tambahan" />
              </div>
            </section>

            {submitError && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-red-700 animate-shake dark:text-red-300">
                {submitError}
              </p>
            )}
            <Button type="submit" loading={loading} className="w-full">
              {loading ? "Mengirim..." : "Ajukan Izin"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="text-base">Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={form.jenisIzin === "PULANG" ? "info" : "default"}>{form.jenisIzin}</Badge>
          </div>
          <dl className="grid grid-cols-[86px_1fr] gap-x-2 gap-y-1">
            <dt className="text-muted-foreground">Tujuan</dt>
            <dd className="font-medium">{form.tujuan || "-"}</dd>
            <dt className="text-muted-foreground">Keluar</dt>
            <dd>{form.tanggalKeluar || "-"}{form.jamKeluar ? ` • ${form.jamKeluar}` : ""}</dd>
            <dt className="text-muted-foreground">Kembali</dt>
            <dd>{form.tanggalKembali || "-"}{form.jamKembali ? ` • ${form.jamKembali}` : ""}</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
