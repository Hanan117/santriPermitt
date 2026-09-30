"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// Logo PDF modern flat - Opsi A (putih + badge merah, 2 garis dokumen)
function PdfIcon({ className, size = 28 }: { className?: string; size?: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 28 32" width={s} height={s} fill="none" className={className} aria-hidden="true">
      <path d="M4 3h13.5L24 9.5V28a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="white" stroke="#e5e7eb" strokeWidth="1.4" />
      <path d="M17.5 3v6.5H24" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.4" />
      <rect x="6" y="14" width="14" height="1.8" rx="0.9" fill="#e5e7eb" />
      <rect x="6" y="17.5" width="10" height="1.8" rx="0.9" fill="#e5e7eb" />
      <rect x="4.5" y="21.5" width="19" height="7.5" rx="3.5" fill="#ef4444" />
      <text x="14" y="26.7" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="white" letterSpacing="0.3">PDF</text>
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export default function AturanPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [role, setRole] = React.useState<string>("");
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    apiFetch<{ id: string; role: string }>("/auth/me")
      .then((me) => setRole(me.role))
      .catch(() => router?.replace("/login"));
  }, [router]);

  React.useEffect(() => {
    apiFetch<{ key: string; value: string }[]>("/rules")
      .then((data) => {
        const pdfRule = data.find((r) => r.key === "rulesPdf");
        if (pdfRule) setPdfUrl(pdfRule.value);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setMessage({ type: "error", text: "Hanya file PDF yang diperbolehkan" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "File terlalu besar (maks 5MB)" });
        return;
      }
      setSelectedFile(file);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || role !== "ADMIN") return;
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const data = await apiFetch<{ url: string }>("/rules/upload", { method: "POST", body: formData });
      setPdfUrl(data.url);
      setSelectedFile(null);
      const el = document.querySelector('input[type="file"]') as HTMLInputElement | null;
      if (el) el.value = "";
      setMessage({ type: "success", text: "PDF berhasil diunggah — santri & wali sudah bisa download" });
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.toLowerCase().includes("413") || msg.toLowerCase().includes("entity too large")) setMessage({ type: "error", text: "File terlalu besar (maks 5MB)" });
      else if (msg.includes("Only PDF")) setMessage({ type: "error", text: "Hanya file PDF yang diperbolehkan" });
      else setMessage({ type: "error", text: msg || "Gagal mengunggah file" });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  const isAdmin = role === "ADMIN";
  const fileName = pdfUrl ? decodeURIComponent(pdfUrl.split("/").pop() || "aturan-pondok.pdf") : null;

  return (
    <div className="mx-auto max-w-[680px] space-y-5">
      {message && (
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm border",
            message.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300 border-green-200 dark:border-green-900"
              : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300 border-red-200 dark:border-red-900"
          )}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Satu kartu utama - simple modern */}
      <Card className="overflow-hidden">
        <CardContent className="p-6 sm:p-7">
          {/* Header minimal */}
          <div className="flex gap-3">
            <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-border shadow-sm">
              <PdfIcon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[20px] font-semibold tracking-tight leading-none">Aturan Pondok</h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                Dokumen resmi aturan keluar & pulang santri. <span className="font-medium text-foreground">Silakan download</span> untuk disimpan offline.
              </p>
            </div>
          </div>

          <div className="mt-6">
            {pdfUrl ? (
              <>
                <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3 min-w-0">
                    <div className="hidden sm:block shrink-0">
                      <PdfIcon size={32} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium leading-none">{fileName}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Tersedia • siap didownload
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:shrink-0">
                    <a href={pdfUrl} download={fileName || "aturan-pondok.pdf"} className="inline-flex">
                      <Button className="w-full sm:w-auto gap-2">
                        <DownloadIcon className="h-4 w-4" />
                        Download PDF
                      </Button>
                    </a>
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
                      <Button variant="ghost" className="w-full sm:w-auto gap-2 border border-border">
                        <ExternalIcon className="h-4 w-4" />
                        Buka
                      </Button>
                    </a>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  Tips: simpan di HP untuk ditunjukkan saat perizinan. Jika tidak bisa dibuka, coba download lalu buka dengan aplikasi PDF.
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 px-6 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border">
                  <PdfIcon size={20} className="opacity-60" />
                </div>
                <p className="mt-3 text-sm font-medium">Belum ada dokumen</p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  {isAdmin ? "Belum ada PDF aturan. Upload di bawah untuk mulai." : "Admin belum mengunggah aturan. Hubungi admin pondok."}
                </p>
              </div>
            )}
          </div>

          {/* Kelola admin - collapsible, jadi 1 card saja */}
          {isAdmin && (
            <details className="mt-6 rounded-xl border border-dashed border-border bg-muted/5 open:bg-muted/10">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium flex items-center justify-between select-none">
                <span>Kelola — ganti PDF (Admin)</span>
                <span className="text-xs text-muted-foreground">5MB • PDF only</span>
              </summary>
              <div className="px-4 pb-4 space-y-3 border-t border-dashed border-border pt-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium hover:file:bg-muted/80"
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    Terpilih: <span className="font-medium text-foreground">{selectedFile.name}</span> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <Button onClick={handleUpload} disabled={!selectedFile || uploading} loading={uploading} className="w-full sm:w-auto">
                  {uploading ? "Mengunggah..." : selectedFile ? "Unggah & Simpan" : "Pilih file dulu"}
                </Button>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
