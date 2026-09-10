import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ className, type, invalid = false, ...props }: InputProps) {
  return (
    <input
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-10 w-full rounded-lg border bg-card px-3 py-2 text-sm shadow-sm transition-all duration-150 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary disabled:opacity-50",
        invalid
          ? "border-danger focus-visible:ring-danger/50 focus-visible:border-danger"
          : "border-border hover:border-muted-foreground/40",
        className,
      )}
      {...props}
    />
  );
}
