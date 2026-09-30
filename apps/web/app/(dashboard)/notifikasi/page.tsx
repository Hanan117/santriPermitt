"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type?: string | null;
  relatedId?: string | null;
  createdAt?: string;
};

export default function NotifikasiPage() {
  const router = useRouter();
  const [notifs, setNotifs] = React.useState<Notif[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"semua" | "belum">("semua");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deletingRead, setDeletingRead] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Notif[] | { data?: Notif[] }>("/notifications");
      setNotifs(Array.isArray(data) ? data : (data.data ?? []));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat notifikasi");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function markOne(n: Notif) {
    if (!n.isRead) {
      try {
        await apiFetch(`/notifications/${n.id}/read`, { method: "PATCH" });
        setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      } catch {
        // ignore
      }
    }
    if (n.relatedId) router.push("/izin/riwayat");
  }

  async function markAll() {
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  }

  async function deleteOne(id: string) {
    if (!confirm("Hapus notifikasi ini?")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/notifications/${id}`, { method: "DELETE" });
      setNotifs((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus notifikasi");
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteRead() {
    const readCount = notifs.filter((n) => n.isRead).length;
    if (readCount === 0) return;
    if (!confirm(`Hapus ${readCount} notifikasi yang sudah dibaca?`)) return;
    setDeletingRead(true);
    try {
      await apiFetch("/notifications/read-all", { method: "DELETE" });
      setNotifs((prev) => prev.filter((n) => !n.isRead));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus notifikasi");
    } finally {
      setDeletingRead(false);
    }
  }

  const readCount = notifs.filter((n) => n.isRead).length;
  const visible = filter === "belum" ? notifs.filter((n) => !n.isRead) : notifs;
  const unread = notifs.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" aria-busy="true" aria-label="Memuat notifikasi">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2" role="tablist" aria-label="Filter notifikasi">
          {(["semua", "belum"] as const).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f ? "bg-primary/10 text-secondary dark:text-emerald-300" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {f === "semua" ? "Semua" : `Belum dibaca (${unread})`}
            </button>
          ))}
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="text-sm font-medium text-primary hover:underline">
            Tandai semua dibaca
          </button>
        )}
        {readCount > 0 && (
          <button
            onClick={deleteRead}
            disabled={deletingRead}
            className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
          >
            {deletingRead ? "Menghapus..." : `Hapus yang sudah dibaca (${readCount})`}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm">
          <p>{error}</p>
          <button onClick={load} className="mt-2 font-medium text-primary hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      {!error && visible.length === 0 && (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {filter === "belum" ? "Semua notifikasi sudah dibaca" : "Tidak ada notifikasi"}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {visible.map((n) => (
          <li key={n.id}>
            <div className="flex w-full items-start gap-3">
              <button
                onClick={() => markOne(n)}
                className={cn(
                  "flex-1 flex flex-col gap-1 rounded-xl border border-border bg-card p-4 text-left shadow-card transition-colors hover:bg-muted",
                  !n.isRead && "border-primary/30 bg-primary/5",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                  <span className="truncate">{n.title}</span>
                </span>
                <span className="text-sm text-muted-foreground">{n.message}</span>
                {n.createdAt && (
                  <time className="text-xs text-muted-foreground" dateTime={n.createdAt}>
                    {new Date(n.createdAt).toLocaleString("id-ID")}
                  </time>
                )}
              </button>
              <button
                onClick={() => deleteOne(n.id)}
                disabled={deletingId === n.id}
                className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger-soft transition-colors disabled:opacity-50"
                aria-label="Hapus notifikasi"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
