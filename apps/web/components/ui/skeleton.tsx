import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-md bg-muted bg-[linear-gradient(100deg,transparent_20%,rgb(255_255_255/0.65)_50%,transparent_80%)] bg-[length:200%_100%] animate-shimmer dark:bg-[linear-gradient(100deg,transparent_20%,rgb(255_255_255/0.08)_50%,transparent_80%)]",
        className ?? "h-4 w-full",
      )}
    />
  );
}

export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
