import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function discountPrice(price: number, discountPercent: number | null): number {
  if (!discountPercent || discountPercent <= 0) return price;
  return Math.round((price * (100 - discountPercent)) / 100);
}

export function absoluteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
  return new URL(path, base).toString();
}

export function isCommercialEmail(email: string): boolean {
  // sanity check before handling - prevents obviously-whitespace abuse
  return email.trim().length > 0 && email.includes("@");
}

export function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function getFieldErrors(err: unknown): Record<string, string> {
  const fieldErrors = (
    err as { data?: { zodError?: { fieldErrors?: Record<string, string[] | undefined> } } }
  ).data?.zodError?.fieldErrors;
  if (!fieldErrors) return {};
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    const first = messages?.[0];
    if (first) result[key] = first;
  }
  return result;
}