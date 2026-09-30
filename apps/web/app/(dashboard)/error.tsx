"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-2xl" aria-hidden="true">
          ⚠
        </span>
        <div>
          <p className="font-semibold">Terjadi kesalahan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "Gagal memuat halaman. Coba lagi."}
          </p>
        </div>
        <Button onClick={reset}>Muat ulang</Button>
      </CardContent>
    </Card>
  );
}
