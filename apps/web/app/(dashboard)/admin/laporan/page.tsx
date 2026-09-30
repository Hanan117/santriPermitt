"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byJenis: { jenis: string; count: number }[];
  byMonth: { month: string; count: number }[];
};

export default function LaporanPage() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiFetch<Stats>("/permissions/stats")
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-12 text-muted-foreground">Gagal memuat data laporan</div>;
  }

  const cards = [
    { label: "Total Izin", value: stats.total, color: "bg-blue-500" },
    { label: "Menunggu", value: stats.pending, color: "bg-yellow-500" },
    { label: "Disetujui", value: stats.approved, color: "bg-green-500" },
    { label: "Ditolak", value: stats.rejected, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Laporan Statistik Perizinan</h1>
        <p className="text-muted-foreground mt-1">Ringkasan data izin untuk pengambilan keputusan</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-3xl font-bold mt-1">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Berdasarkan Jenis Izin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byJenis.map((item) => (
                <div key={item.jenis} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{item.jenis === "KELUAR" ? "Keluar Sementara" : "Pulang"}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tren 6 Bulan Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.byMonth.map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm">{item.month}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
              {stats.byMonth.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Belum ada data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}