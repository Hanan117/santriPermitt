"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Permission = { status: string };

export default function DashboardPage() {
  const [counts, setCounts] = React.useState({ menunggu: 0, disetujui: 0, total: 0 });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: Permission[] } | Permission[]>("/permissions?limit=100");
        const list: Permission[] = Array.isArray(res) ? res : (res as { data: Permission[] }).data ?? [];
        const menunggu = list.filter((p) => p.status === "MENUNGGU").length;
        const disetujui = list.filter((p) => p.status === "DISETUJUI").length;
        setCounts({ menunggu, disetujui, total: list.length });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Memuat dashboard...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Menunggu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.menunggu}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Disetujui</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{counts.disetujui}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Riwayat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.total}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
