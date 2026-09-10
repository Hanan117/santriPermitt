"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Me = { role?: string; username?: string; santriId?: string };

type Notif = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type?: string | null;
  createdAt?: string;
};

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Header({ me }: { me: Me | null }) {
  const router = useRouter();
  const [notifs, setNotifs] = React.useState<Notif[]>([]);
  const [openPanel, setOpenPanel] = React.useState<"notif" | "user" | null>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifs = React.useCallback(async () => {
    try {
      const data = await apiFetch<Notif[] | { data?: Notif[] }>("/notifications");
      const list = Array.isArray(data) ? data : (data.data ?? []);
      setNotifs(list);
    } catch {
      // ignore polling errors
    }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => { fetchNotifs(); }, 0);
    const id = setInterval(fetchNotifs, 30000);
    return () => { clearTimeout(t); clearInterval(id); };
  }, [fetchNotifs]);

  React.useEffect(() => {
    if (!openPanel) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenPanel(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPanel(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openPanel]);

  const unread = notifs.filter((n) => !n.isRead).length;

  async function markAllRead() {
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  }

  async function openNotif(n: Notif) {
    if (!n.isRead) {
      try {
        await apiFetch(`/notifications/${n.id}/read`, { method: "PATCH" });
        setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      } catch {
        // ignore
      }
    }
    setOpenPanel(null);
    router.push("/izin/riwayat");
  }

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-white shadow-card">
            S
          </span>
          SantriPermit
        </Link>
        <div ref={wrapRef} className="relative flex items-center gap-2">
          <button
            aria-label="Notifikasi"
            aria-expanded={openPanel === "notif"}
            onClick={() => setOpenPanel((p) => (p === "notif" ? null : "notif"))}
            className={cn(
              "relative rounded-lg p-2 transition-colors hover:bg-muted",
              openPanel === "notif" && "bg-muted",
            )}
          >
            <BellIcon />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
          {openPanel === "notif" && (
            <div className="absolute right-0 top-12 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-pop animate-fade-up">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <p className="text-sm font-semibold">Notifikasi</p>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">
                    Tandai dibaca
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada notifikasi</p>
                ) : (
                  notifs.slice(0, 20).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => openNotif(n)}
                      className={cn(
                        "flex w-full flex-col gap-0.5 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted",
                        !n.isRead && "bg-primary/5",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                        <span className="truncate">{n.title}</span>
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          <button
            aria-label="Menu pengguna"
            aria-expanded={openPanel === "user"}
            onClick={() => setOpenPanel((p) => (p === "user" ? null : "user"))}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white shadow-card transition-transform active:scale-95",
              openPanel === "user" && "ring-2 ring-primary/50",
            )}
          >
            {initials(me?.username)}
          </button>
          {openPanel === "user" && (
            <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-pop animate-fade-up">
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-semibold">{me?.username ?? "-"}</p>
                <p className="text-xs text-muted-foreground">{me?.role ?? ""}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
