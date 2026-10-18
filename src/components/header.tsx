"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, Search, Menu, X, ChevronDown, MonitorPlay } from "lucide-react";
import { api } from "@/trpc/react";
import { useSession } from "@/app/providers";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui";

type CategoryLite = { slug: string; name: string };

export function Header({ categories }: { categories: CategoryLite[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, pending } = useSession();
  const { data: cartCount } = api.cart.count.useQuery(undefined, {
    enabled: !!session,
    staleTime: 15_000,
  });
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const search = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/produk${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
    setMenuOpen(false);
  };

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        pathname === href || (href !== "/" && pathname.startsWith(href))
          ? "text-brand"
          : "text-zinc-300 hover:text-zinc-50",
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/80 backdrop-blur-md">
      <div className="container-x flex h-16 items-center gap-3">
        <button
          type="button"
          aria-label="Menu"
          className="grid size-10 place-items-center rounded-lg text-zinc-300 hover:bg-zinc-800/70 lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-brand">
          <span className="grid size-9 place-items-center rounded-lg bg-brand font-black text-zinc-950 shadow-[0_0_20px_rgba(163,230,53,0.35)]">
            TK
          </span>
          <span className="hidden text-lg font-bold tracking-tight sm:block">TokoKomputer</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLink("/", "Beranda")}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCatOpen((v) => !v)}
              onBlur={() => setTimeout(() => setCatOpen(false), 150)}
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-50"
              aria-expanded={catOpen}
            >
              Katalog <ChevronDown className="size-3.5" />
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-2 shadow-2xl">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/produk?category=${c.slug}`}
                    className="block rounded-lg px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-brand"
                    onClick={() => setCatOpen(false)}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {navLink("/produk", "Semua Produk")}
          <Link href="/produk?sort=termurah" className="ml-1 flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-brand">
            <MonitorPlay className="size-4" /> PC Rakitan
          </Link>
        </nav>

        <form onSubmit={search} className="relative ml-auto hidden flex-1 max-w-xs items-center sm:flex" role="search">
          <Search className="pointer-events-none absolute left-3 size-4 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari laptop, GPU, RAM..."
            aria-label="Cari produk"
            className="w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
          <Link
            href="/keranjang"
            aria-label={`Keranjang (${cartCount ?? 0} item)`}
            className="relative grid size-10 place-items-center rounded-lg text-zinc-200 transition-colors hover:bg-zinc-800/70"
          >
            <ShoppingCart className="size-5" />
            {!!session && cartCount ? (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-zinc-950">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
          {pending ? null : session ? (
            <Link href="/akun" className={buttonClass("secondary", "sm", "hidden sm:inline-flex")}>
              {session.name.split(" ")[0]}
            </Link>
          ) : (
            <Link href="/login" className={buttonClass("primary", "sm", "hidden sm:inline-flex")}>
              Masuk
            </Link>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-line bg-background lg:hidden">
          <div className="container-x flex flex-col gap-1 py-4">
            <form onSubmit={search} role="search" className="relative flex sm:hidden">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari produk..."
                aria-label="Cari produk"
                className="w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand/70 focus:outline-none"
              />
            </form>
            {navLink("/", "Beranda")}
            {navLink("/produk", "Semua Produk")}
            <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Kategori
            </div>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/produk?category=${c.slug}`}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-zinc-300 hover:text-brand"
              >
                {c.name}
              </Link>
            ))}
            <div className="mt-3 flex gap-2 px-3">
              {pending ? null : session ? (
                <Link
                  href="/akun"
                  onClick={() => setMenuOpen(false)}
                  className={buttonClass("secondary", "md", "flex-1")}
                >
                  Akun Saya
                </Link>
              ) : (
                <>
                  <Link href="/login" className={buttonClass("primary", "md", "flex-1")}>Masuk</Link>
                  <Link href="/daftar" className={buttonClass("secondary", "md", "flex-1")}>Daftar</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}