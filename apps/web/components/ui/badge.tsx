import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  dot?: boolean;
}

const variantClasses: Record<string, string> = {
  default: "bg-primary text-primary-foreground",
  success: "bg-success-soft text-secondary dark:text-emerald-300",
  warning: "bg-warning-soft text-amber-800 dark:text-amber-300",
  danger: "bg-danger-soft text-red-700 dark:text-red-300",
  info: "bg-info-soft text-blue-800 dark:text-blue-300",
  outline: "border border-border text-foreground",
};

const dotClasses: Record<string, string> = {
  default: "bg-primary-foreground",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  outline: "bg-muted-foreground",
};

export function Badge({ className, variant = "default", dot = false, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[variant])} aria-hidden="true" />}
      {children}
    </div>
  );
}
