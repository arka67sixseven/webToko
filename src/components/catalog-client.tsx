"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/trpc/react";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

type InitialParams = {
  q?: string;
  category?: string;
  brand?: string;
  origin?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
};

type CatalogClientProps = {
  categories: { slug: string; name: string }[];
  brands: { brand: string | null }[];
  initial: InitialParams;
};

const sortOptions = [
  { value: "terbaru", label: "Terbaru" },
  { value: "populer", label: "Terpopuler" },
  { value: "termurah", label: "Harga Terendah" },
  { value: "termahal", label: "Harga Tertinggi" },
];

export function CatalogClient({ categories, brands, initial }: CatalogClientProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<InitialParams>(initial);
  const [searchInput, setSearchInput] = useState(initial.q ?? "");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== (filters.q ?? "")) {
        update({ q: searchInput || undefined, page: undefined });
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  function update(patch: Partial<InitialParams>) {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams();
    (Object.entries(next) as [string, string | undefined][]).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setFilters(next);
    router.replace(`/produk${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  const { data, isLoading, isFetching } = api.catalog.list.useQuery(
    {
      q: filters.q ?? "",
      category: filters.category ?? "",
      brand: filters.brand ?? "",
      origin: (filters.origin as "LOCAL" | "IMPORTED") || undefined,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      sort: (filters.sort ?? "terbaru") as "terbaru",
      page: filters.page ? Number(filters.page) : 1,
    },
    { placeholderData: (prev) => prev },
  );

  const page = data?.page ?? Number(filters.page ?? 1);
  const totalPages = data?.totalPages ?? 1;

  function clearAll() {
    setFilters({});
    setSearchInput("");
    router.replace("/produk");
  }

  const activeFilterCount = [
    filters.category,
    filters.brand,
    filters.origin,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="container-x py-8">
      <nav className="mb-5 text-xs text-zinc-500">
        <Link href="/" className="hover:text-brand">Beranda</Link>
        <span className="mx-1.5">/</span>
        <span className="text-zinc-300">Semua Produk</span>
      </nav>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24 flex flex-col gap-6">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <SlidersHorizontal className="size-4 text-brand" /> Filter
              </h3>
              <FilterGroup
                label="Kategori"
                options={categories.map((c) => ({ value: c.slug, label: c.name }))}
                value={filters.category}
                onChange={(v) => update({ category: v, page: undefined })}
              />
            </div>
            <FilterGroup
              label="Brand"
              options={(brands ?? []).map((b) => ({ value: b.brand!, label: b.brand! }))}
              value={filters.brand}
              onChange={(v) => update({ brand: v, page: undefined })}
              allowClear
            />
            <FilterGroup
              label="Asal Produk"
              options={[
                { value: "LOCAL", label: "Produk Lokal" },
                { value: "IMPORTED", label: "Produk Impor" },
              ]}
              value={filters.origin}
              onChange={(v) => update({ origin: v, page: undefined })}
              allowClear
            />
            <FilterGroup
              label="Urutkan"
              options={sortOptions}
              value={filters.sort ?? "terbaru"}
              onChange={(v) => update({ sort: v, page: undefined })}
            />
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Rentang Harga (Rp)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  inputMode="numeric"
                  placeholder="Min"
                  value={filters.minPrice ?? ""}
                  onChange={(e) => update({ minPrice: e.target.value || undefined, page: undefined })}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand/70 focus:outline-none"
                  aria-label="Harga minimum"
                />
                <input
                  inputMode="numeric"
                  placeholder="Max"
                  value={filters.maxPrice ?? ""}
                  onChange={(e) => update({ maxPrice: e.target.value || undefined, page: undefined })}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand/70 focus:outline-none"
                  aria-label="Harga maksimum"
                />
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-left text-xs font-medium text-zinc-500 hover:text-red-400">
                Hapus semua filter ({activeFilterCount})
              </button>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari produk, brand, atau spesifikasi..."
                aria-label="Cari produk"
                className="w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-9 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(""); update({ q: undefined, page: undefined }); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                  aria-label="Bersihkan pencarian"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-medium lg:hidden",
                showFilters ? "border-brand/50 text-brand" : "text-zinc-200",
              )}
            >
              <SlidersHorizontal className="size-4" /> Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>

          {/* Mobile filters */}
          {showFilters && (
            <div className="mb-5 rounded-xl border border-line bg-surface p-4 lg:hidden">
              <div className="flex flex-wrap items-end gap-3">
                <FilterGroup
                  label="Kategori"
                  options={categories.map((c) => ({ value: c.slug, label: c.name }))}
                  value={filters.category}
                  onChange={(v) => update({ category: v, page: undefined })}
                />
                <FilterGroup
                  label="Brand"
                  options={(brands ?? []).map((b) => ({ value: b.brand!, label: b.brand! }))}
                  value={filters.brand}
                  onChange={(v) => update({ brand: v, page: undefined })}
                  allowClear
                />
                <FilterGroup
                  label="Urutkan"
                  options={sortOptions}
                  value={filters.sort ?? "terbaru"}
                  onChange={(v) => update({ sort: v, page: undefined })}
                />
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Harga (Rp)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      inputMode="numeric"
                      placeholder="Min"
                      value={filters.minPrice ?? ""}
                      onChange={(e) => update({ minPrice: e.target.value || undefined, page: undefined })}
                      className="w-24 rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand/70 focus:outline-none"
                    />
                    <input
                      inputMode="numeric"
                      placeholder="Max"
                      value={filters.maxPrice ?? ""}
                      onChange={(e) => update({ maxPrice: e.target.value || undefined, page: undefined })}
                      className="w-24 rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand/70 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="mb-4 text-sm text-zinc-500">
            {isLoading ? "Memuat..." : `${data?.total ?? 0} produk ditemukan`}
            {filters.q ? ` untuk "${filters.q}"` : ""}
          </p>

          {isLoading && !data ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-line bg-surface p-3">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <Skeleton className="mt-3 h-4 w-2/3" />
                  <Skeleton className="mt-2 h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : data && data.items.length ? (
            <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4", isFetching && "opacity-60 transition-opacity")}>
              {data.items.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          ) : (
            <div className="grid place-items-center rounded-xl border border-dashed border-line py-20 text-center">
              <div>
                <p className="text-sm font-medium text-zinc-300">Tidak ada produk yang cocok</p>
                <p className="mt-1 text-xs text-zinc-500">Coba ubah kata kunci atau hapus filter.</p>
                <button onClick={clearAll} className="mt-4 text-sm font-medium text-brand hover:text-lime-300">
                  Hapus semua filter
                </button>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => update({ page: String(page - 1) })}
                disabled={page <= 1}
                aria-label="Halaman sebelumnya"
                className="grid size-10 place-items-center rounded-lg border border-line text-zinc-300 transition-colors hover:border-brand/50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-3 text-sm text-zinc-400">
                Halaman {page} / {totalPages}
              </span>
              <button
                onClick={() => update({ page: String(page + 1) })}
                disabled={page >= totalPages}
                aria-label="Halaman berikutnya"
                className="grid size-10 place-items-center rounded-lg border border-line text-zinc-300 transition-colors hover:border-brand/50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
  allowClear,
}: {
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value: string | undefined) => void;
  allowClear?: boolean;
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5 lg:flex-col lg:items-stretch">
        {allowClear && value && (
          <button
            onClick={() => onChange(undefined)}
            className="flex items-center gap-1 text-left text-xs text-zinc-500 hover:text-red-400"
          >
            <X className="size-3" /> Semua
          </button>
        )}
        {options.slice(0, allowClear ? 12 : 8).map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(selected?.value === o.value && allowClear ? undefined : o.value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors lg:text-left",
              selected?.value === o.value
                ? "border-brand/60 bg-brand/10 text-brand"
                : "border-line text-zinc-300 hover:border-zinc-600 hover:text-zinc-50",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}