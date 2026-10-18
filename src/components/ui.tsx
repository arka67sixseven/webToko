"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-zinc-950 hover:bg-lime-300 active:bg-lime-400 disabled:bg-zinc-700 disabled:text-zinc-500",
  secondary: "bg-surface-2 text-zinc-100 hover:bg-zinc-800 border border-line",
  outline: "border border-line text-zinc-100 hover:border-brand/60 hover:text-brand",
  ghost: "text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/70",
  danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
    "disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.985]",
    "select-none whitespace-nowrap cursor-pointer",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  loading,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading ? <Spinner className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function Badge({
  children,
  tone = "brand",
  className,
}: {
  children: ReactNode;
  tone?: "brand" | "accent" | "muted" | "danger" | "success" | "warning";
  className?: string;
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand/15 text-brand border-brand/30",
    accent: "bg-accent/10 text-cyan-300 border-accent/25",
    muted: "bg-zinc-800 text-zinc-400 border-zinc-700",
    danger: "bg-red-500/10 text-red-400 border-red-500/30",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-zinc-800/80", className)} />;
}

export function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <span className="text-[13px] font-medium text-zinc-300">{label}</span>
      ) : null}
      {children}
      {hint && !error ? <span className="text-xs text-zinc-500">{hint}</span> : null}
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60";

export function Rating({
  value,
  size = "md",
  className,
}: {
  value: number | null | undefined;
  size?: "sm" | "md";
  className?: string;
}) {
  if (!value) return null;
  const stars = size === "sm" ? "size-3.5" : "size-4";
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Rating ${value} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0;
        return (
          <svg key={i} viewBox="0 0 20 20" className={cn(stars, "shrink-0")} aria-hidden>
            <defs>
              <linearGradient id={`star-${i}-${Math.round(value * 10)}`}>
                <stop offset={fill * 100 + "%"} stopColor="#facc15" />
                <stop offset={fill * 100 + "%"} stopColor="#3f3f46" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#star-${i}-${Math.round(value * 10)})`}
              d="M9.05 2.93c.3-.921 1.6-.921 1.9 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.722c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        );
      })}
    </span>
  );
}