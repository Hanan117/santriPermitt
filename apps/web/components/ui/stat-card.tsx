import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

const toneClasses: Record<string, string> = {
  default: "bg-muted text-foreground",
  primary: "bg-brand-gradient text-white",
  success: "bg-success-soft text-secondary dark:text-emerald-300",
  warning: "bg-warning-soft text-amber-800 dark:text-amber-300",
  danger: "bg-danger-soft text-red-700 dark:text-red-300",
  info: "bg-info-soft text-blue-800 dark:text-blue-300",
};

export function StatCard({
  label,
  value,
  icon,
  tone = "default",
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: keyof typeof toneClasses;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn("transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5", className)}>
      <CardContent className="flex items-center gap-4 p-5">
        {icon && (
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl", toneClasses[tone])}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tabular-nums">{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
