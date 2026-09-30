import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  label?: string;
}

// Floated state (label kecil di atas): saat input fokus atau terisi.
// :placeholder-shown hanya cocok saat kosong (placeholder=" " di input),
// jadi :not(:placeholder-shown) mencakup ketikan, value awal, dan autofill.
const floated =
  "peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-medium peer-focus:bg-card peer-focus:px-1 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:bg-card peer-[:not(:placeholder-shown)]:px-1";

export function Input({ className, type, invalid = false, label, ...props }: InputProps) {
  const id = props.id || React.useId();
  const labelId = label ? `${id}-label` : undefined;

  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={labelId}
        placeholder=" "
        className={cn(
          "peer flex h-12 w-full rounded-lg border bg-card px-3 pb-1 pt-4 text-sm shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary disabled:opacity-50",
          label ? "placeholder:text-transparent" : "placeholder:text-muted-foreground",
          invalid
            ? "border-danger focus-visible:ring-danger/50 focus-visible:border-danger"
            : "border-border hover:border-muted-foreground/40",
          className,
        )}
        {...props}
      />
      {label && (
        <label
          id={labelId}
          htmlFor={id}
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none transition-all duration-150",
            floated,
            invalid ? "text-danger peer-focus:text-danger" : "peer-focus:text-primary",
          )}
          aria-hidden="true"
        >
          {label}
        </label>
      )}
    </div>
  );
}
