"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { clearToken } from "@/lib/auth";

type Me = { role?: string; username?: string; santriId?: string };

export function Header({ me }: { me: Me | null }) {
  const router = useRouter();
  const [notifCount, setNotifCount] = React.useState(0);

  const fetchNotifs = React.useCallback(async () => {
    try {
      const data = await apiFetch<{ unreadCount?: number; count?: number; total?: number; data?: unknown[] }>(
        "/notifications",
      );
      const c = data.unreadCount ?? data.count ?? (Array.isArray(data.data) ? data.data.length : 0);
      // fallback: if API returns array directly
      if (typeof c === "number") setNotifCount(c);
    } catch {
      // ignore polling errors
    }
  }, []);

  React.useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <Link href="/dashboard" className="font-semibold">
        SantriPermit
      </Link>
      <div className="flex items-center gap-4">
        <button
          aria-label="notifications"
          onClick={() => router.push("/izin/riwayat")}
          className="relative rounded p-2 hover:bg-muted"
        >
          <span className="text-lg">🔔</span>
          {notifCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">
              {notifCount > 99 ? "99+" : notifCount}
            </span>
          )}
        </button>
        {me?.username && <span className="text-sm text-muted-foreground">{me.username} ({me.role})</span>}
        <button onClick={handleLogout} className="text-sm font-medium hover:underline">
          Logout
        </button>
      </div>
    </header>
  );
}
