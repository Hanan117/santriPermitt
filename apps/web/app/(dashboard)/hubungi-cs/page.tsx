"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

function formatWaDisplay(raw?: string | null) {
  if (!raw) return "-";
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62")) {
    return `0${digits.slice(2).replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3")}`;
  }
  return digits.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
}

function normalizeWaInput(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return `62${digits}`;
}

function buildWaLink(number: string, text: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export default function HubungiCSPage() {
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = React.useState({ nama: "", email: "", pesan: "" });
  const [waNumber, setWaNumber] = React.useState<string>("6287755889669");
  const [waLoading, setWaLoading] = React.useState(true);
  const [showWaModal, setShowWaModal] = React.useState(false);
  const [waSaving, setWaSaving] = React.useState(false);
  const [waSaveMessage, setWaSaveMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [me, setMe] = React.useState<{ role?: string } | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const [rulesRes, meRes] = await Promise.all([
          apiFetch<{ key: string; value: string }[]>("/rules"),
          apiFetch<{ role?: string }>("/auth/me"),
        ]);
        const waRule = rulesRes.find((r) => r.key === "cs_whatsapp");
        if (waRule?.value) setWaNumber(waRule.value);
        setMe(meRes);
      } catch {
        // ignore
      } finally {
        setWaLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.pesan.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await apiFetch("/contact", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setMessage({ type: "success", text: "Pesan terkirim. Tim CS kami akan segera merespons." });
      setFormData({ nama: "", email: "", pesan: "" });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message ?? "Gagal mengirim pesan" });
    } finally {
      setSubmitting(false);
    }
  };

  const getWaText = () => {
    const base = formData.pesan.trim()
      ? `Halo Admin, saya ${formData.nama || "pengguna"} ingin bertanya: ${formData.pesan.trim()}`
      : `Halo Admin SantriPermit, saya ${formData.nama || "pengguna"} ingin bertanya...`;
    return base;
  };

  const handleWaSave = async () => {
    const normalized = normalizeWaInput(waNumber);
    if (!/^62\d{9,13}$/.test(normalized)) {
      setWaSaveMessage({ type: "error", text: "Format nomor tidak valid (contoh: 087755889669 atau 6287755889669)" });
      return;
    }
    setWaSaving(true);
    setWaSaveMessage(null);
    try {
      await apiFetch("/rules", {
        method: "PUT",
        body: JSON.stringify({ cs_whatsapp: normalized }),
      });
      setWaNumber(normalized);
      setWaSaveMessage({ type: "success", text: "Nomor WA Admin diperbarui — berlaku untuk semua pengguna" });
    } catch (err: any) {
      setWaSaveMessage({ type: "error", text: err?.message ?? "Gagal menyimpan nomor" });
    } finally {
      setWaSaving(false);
    }
  };

  const isAdmin = me?.role === "ADMIN";
  const waDisplay = formatWaDisplay(waNumber);
  const waLink = buildWaLink(waNumber, getWaText());

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Hubungi Customer Service</h1>
        <p className="text-muted-foreground mt-1">Kami siap membantu Anda. Pilih saluran di bawah ini.</p>
      </div>

      {message && (
        <div
          className={cn(
            "rounded-lg p-4 text-sm",
            message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          )}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Card WA - di atas form, paling visible */}
      {!waLoading && (
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xl">💬</span>
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200">Chat Admin via WhatsApp</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Respon tercepat — langsung ke WA Admin</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-sm font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg">
                  {waDisplay}
                </span>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!waNumber}
                  onClick={() => setShowWaModal(true)}
                >
                  Buka WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kirim Pesan</CardTitle>
          <CardDescription>Isi data di bawah ini untuk menghubungi tim support</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nama" className="block text-sm font-medium">Nama *</label>
              <Input
                id="nama"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                placeholder="Nama Anda"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@contoh.com (opsional)"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="pesan" className="block text-sm font-medium">Pesan *</label>
              <textarea
                id="pesan"
                name="pesan"
                value={formData.pesan}
                onChange={handleChange}
                rows={5}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Tulis pesan Anda di sini..."
                required
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? <Spinner className="mr-2 h-4 w-4" /> : null} Kirim Pesan
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Kelola Nomor WA - hanya ADMIN */}
      {isAdmin && !waLoading && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="h-5 w-5">🔧</span>
              Kelola Nomor WA Admin
            </CardTitle>
            <CardDescription>Nomor ini digunakan untuk tombol "Buka WhatsApp" di atas. Perubahan langsung berlaku untuk semua pengguna.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {waSaveMessage && (
              <div
                className={cn(
                  "rounded-lg p-3 text-sm",
                  waSaveMessage.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                )}
                role="alert"
              >
                {waSaveMessage.text}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="wa-input" className="block text-sm font-medium">Nomor WA Admin (format 08xx atau 628xx)</label>
              <Input
                id="wa-input"
                type="tel"
                value={waDisplay === "-" ? "" : waDisplay}
                onChange={(e) => setWaNumber(normalizeWaInput(e.target.value))}
                placeholder="087755889669"
              />
              <p className="text-xs text-muted-foreground">Masukkan nomor tanpa spasi/tanda. Contoh: 087755889669 atau 6287755889669</p>
            </div>
            <Button onClick={handleWaSave} disabled={waSaving} className="w-full sm:w-auto">
              {waSaving ? <Spinner className="mr-2 h-4 w-4" /> : null} Simpan Nomor WA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal WA */}
      <Modal
        open={showWaModal}
        onClose={() => setShowWaModal(false)}
        title="Chat via WhatsApp"
        description="Anda akan diarahkan ke WhatsApp Admin SantriPermit"
        position="top"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowWaModal(false)}>
              Batal
            </Button>
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Buka WhatsApp</Button>
            </a>
          </div>
        }
      >
        <div className="space-y-3 mt-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Nomor tujuan</p>
            <p className="font-mono text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 rounded-lg">{waDisplay}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Preview pesan</p>
            <textarea
              readOnly
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground focus:outline-none"
              value={getWaText()}
            />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span>✓</span> Pastikan WhatsApp terpasang di perangkat Anda
          </p>
        </div>
      </Modal>
    </div>
  );
}