"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/trpc/react";
import { useSession } from "@/app/providers";
import { Button, Badge, Field, inputClass, Skeleton } from "@/components/ui";
import { formatIDR, cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORIGIN_LABEL } from "@/lib/constants";
import type { AdminProductInput } from "@/server/validators";

type Tab = "dashboard" | "products" | "orders" | "categories";

export default function AdminPage() {
  const { session, pending } = useSession();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (pending) {
    return (
      <div className="container-x py-20">
        <div className="mx-auto h-32 w-full max-w-2xl animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );
  }

  if (!session || session.role !== "ADMIN") {
    return (
      <div className="container-x py-24 text-center">
        <ShieldAlert className="mx-auto mb-4 size-12 text-zinc-700" />
        <h1 className="mb-2 text-2xl font-bold">Akses Ditolak</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Halaman ini khusus untuk admin. Login dengan akun admin untuk melanjutkan.
        </p>
        <Link href={session ? "/akun" : "/login"} className="inline-flex h-12 items-center rounded-lg bg-brand px-6 font-semibold text-zinc-950">
          {session ? "Kembali ke akun" : "Masuk sebagai admin"}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Admin Panel</h1>
          <p className="mt-1 text-sm text-zinc-500">Kelola produk dan pesanan dgn mudah</p>
        </div>
        <Badge tone="brand" className="text-xs">Logged in sebagai {session.email}</Badge>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-line pb-4">
        {([
          { id: "dashboard" as Tab, icon: LayoutDashboard, label: "Dashboard" },
          { id: "products" as Tab, icon: Package, label: "Produk" },
          { id: "orders" as Tab, icon: ShoppingBag, label: "Pesanan" },
          { id: "categories" as Tab, icon: Users, label: "Kategori" },
        ]).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium",
              tab === id ? "border-brand/60 bg-brand/10 text-brand" : "border-line text-zinc-300 hover:border-zinc-600 hover:text-zinc-50",
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab />}
      {tab === "products" && <ProductsTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "categories" && <CategoriesTab />}
    </div>
  );
}

function DashboardTab() {
  const { data, isLoading } = api.admin.stats.useQuery();
  if (isLoading || !data) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  }
  const cards = [
    { label: "Produk", value: data.productCount, accent: "text-brand" },
    { label: "Pesanan", value: data.orderCount, accent: "text-cyan-300" },
    { label: "Pembeli", value: data.userCount, accent: "text-amber-400" },
    { label: "Pendapatan", value: formatIDR(data.revenue), accent: "text-emerald-400" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{c.label}</p>
          <p className={cn("mt-2 text-2xl font-black tracking-tight", c.accent)}>{c.value}</p>
        </div>
      ))}
      {data.lowStock > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:col-span-2 lg:col-span-4">
          <p className="text-sm font-semibold text-amber-400">
            ⚠️ {data.lowStock} produk dengan stok tinggal ≤ 5. Segera restock!
          </p>
        </div>
      )}
    </div>
  );
}

type AdminProductFormProps = {
  initial?: AdminProductInput;
  categories: { slug: string; name: string }[];
  onDone: () => void;
};

function ProductForm({ initial, categories, onDone }: AdminProductFormProps) {
  const [form, setForm] = useState<AdminProductInput>(
    initial ?? {
      name: "",
      brand: "",
      description: "",
      price: 0,
      currency: "IDR",
      stock: 0,
      origin: "LOCAL",
      categorySlug: categories[0]?.slug ?? "",
      featured: false,
      isNew: false,
      discountPercent: 0,
      specs: {},
    },
  );
  const [specs, setSpecs] = useState(JSON.stringify(form.specs ?? {}, null, 2));

  const utils = api.useUtils();
  const save = api.admin.product.save.useMutation({
    onSuccess: () => {
      toast.success(initial ? "Produk diperbarui" : "Produk ditambahkan");
      utils.admin.stats.invalidate();
      utils.catalog.list.invalidate();
      utils.catalog.categories.invalidate();
      utils.admin.product.invalidate();
      onDone();
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = () => {
    let parsedSpecs: Record<string, string> = {};
    try {
      parsedSpecs = specs.trim() ? JSON.parse(specs) : {};
      if (typeof parsedSpecs !== "object" || Array.isArray(parsedSpecs)) throw new Error();
    } catch {
      toast.error("Specs harus berupa JSON object yang valid");
      return;
    }
    if (!form.categorySlug) {
      toast.error("Pilih kategori");
      return;
    }
    save.mutate({ ...form, specs: parsedSpecs });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-zinc-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-2xl border border-line bg-surface p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? "Edit Produk" : "Tambah Produk"}</h2>
          <button onClick={onDone} aria-label="Tutup" className="text-zinc-400 hover:text-zinc-100">
            <X className="size-5" />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Produk">
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Brand">
            <input className={inputClass} value={form.brand ?? ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </Field>
          <Field label="Kategori">
            <select className={inputClass} value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Asal">
            <select className={inputClass} value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value as "LOCAL" | "IMPORTED" })}>
              <option value="LOCAL">Lokal</option>
              <option value="IMPORTED">Impor</option>
            </select>
          </Field>
          <Field label="Harga (Rp)">
            <input className={inputClass} type="number" min={1} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </Field>
          <Field label="Diskon (%)">
            <input className={inputClass} type="number" min={0} max={90} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} />
          </Field>
          <Field label="Stok">
            <input className={inputClass} type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          </Field>
          <div className="flex items-end gap-4 pb-1">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="size-4 accent-lime-400" />
              Unggulan
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={form.isNew} onChange={(e) => setForm({ ...form, isNew: e.target.checked })} className="size-4 accent-cyan-400" />
              Baru
            </label>
          </div>
          <Field label="Deskripsi" className="sm:col-span-2">
            <textarea className={cn(inputClass, "resize-none")} rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label={'Spesifikasi (JSON) — contoh: {"Prosesor":"i7-13700K"}'} className="sm:col-span-2">
            <textarea className={cn(inputClass, "resize-none font-mono text-xs")} rows={5} value={specs} onChange={(e) => setSpecs(e.target.value)} />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onDone}>Batal</Button>
          <Button onClick={submit} loading={save.isPending}>{initial ? "Simpan Perubahan" : "Tambah Produk"}</Button>
        </div>
      </div>
    </div>
  );
}

function EditProduct({ productId, categories, onDone }: { productId: string; categories: { slug: string; name: string }[]; onDone: () => void }) {
  const { data: product, isLoading } = api.admin.product.byId.useQuery({ id: productId });

  if (isLoading || !product) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/70 p-4 backdrop-blur-sm">
        <Skeleton className="h-64 w-full max-w-2xl rounded-2xl" />
      </div>
    );
  }

  const initial: AdminProductInput = {
    id: product.id,
    name: product.name,
    brand: product.brand ?? "",
    description: product.description ?? "",
    price: product.price,
    currency: product.currency,
    stock: product.stock,
    origin: product.origin,
    categorySlug: product.category.slug,
    featured: product.featured,
    isNew: product.isNew,
    discountPercent: product.discountPercent ?? 0,
    specs: (product.specs as Record<string, string>) ?? {},
  };

  return <ProductForm initial={initial} categories={categories} onDone={onDone} />;
}

function ProductsTab() {
  const { data: categories } = api.admin.categories.useQuery();
  const { data: products, isLoading } = api.catalog.list.useQuery({ page: 1, pageSize: 60 });
  const utils = api.useUtils();
  const deleteProduct = api.admin.product.delete.useMutation({
    onSuccess: () => {
      toast.success("Produk dihapus");
      utils.catalog.list.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading || !categories || !products) {
    return <div className="grid grid-cols-1 gap-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditingId(null);
            setCreating(true);
          }}
        >
          <Plus className="size-4" /> Tambah Produk
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Harga</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.items.map((p) => (
              <tr key={p.slug} className="border-b border-line last:border-0 hover:bg-surface-2/50">
                <td className="px-4 py-3">
                  <Link href={`/produk/${p.slug}`} className="font-medium text-zinc-100 hover:text-brand">
                    {p.name}
                  </Link>
                  <p className="text-xs text-zinc-500">{p.brand}</p>
                </td>
                <td className="px-4 py-3 text-zinc-400">{p.categoryId ? <Badge tone="muted">{p.origin === "IMPORTED" ? "Impor" : "Lokal"}</Badge> : null} {ORIGIN_LABEL[p.origin]}</td>
                <td className="px-4 py-3 tabular-nums text-zinc-200">{formatIDR(p.priceAfterDiscount)}</td>
                <td className={cn("px-4 py-3 tabular-nums", p.stock === 0 ? "text-red-400" : p.stock <= 5 ? "text-amber-400" : "text-zinc-200")}>
                  {p.stock}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => {
                        setCreating(false);
                        setEditingId(p.id ?? null);
                      }}
                      aria-label={`Edit ${p.name}`}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-brand"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus "${p.name}"?`)) deleteProduct.mutate({ id: p.id ?? "" });
                      }}
                      aria-label={`Hapus ${p.name}`}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {creating && (
        <ProductForm categories={categories} onDone={() => setCreating(false)} />
      )}
      {editingId && (
        <EditProduct
          productId={editingId}
          categories={categories}
          onDone={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function OrdersTab() {
  const { data: orders, isLoading } = api.admin.orders.list.useQuery();
  const utils = api.useUtils();
  const updateStatus = api.admin.orders.updateStatus.useMutation({
    onSuccess: async () => {
      toast.success("Status diperbarui");
      await utils.admin.orders.list.invalidate();
      await utils.admin.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading || !orders) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Pembeli</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-line last:border-0 hover:bg-surface-2/50">
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-zinc-400">{o.id.slice(0, 8)}</span>
                <p className="text-xs text-zinc-500">{o.items.length} item</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-zinc-200">{o.user.name}</p>
                <p className="text-xs text-zinc-500">{o.user.email}</p>
              </td>
              <td className="px-4 py-3 font-semibold tabular-nums">{formatIDR(o.totalAmount)}</td>
              <td className="px-4 py-3">
                <select
                  value={o.status}
                  onChange={(e) => updateStatus.mutate({ orderId: o.id, status: e.target.value as never })}
                  className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-zinc-100 focus:border-brand/70 focus:outline-none"
                  aria-label={`Ubah status pesanan ${o.id}`}
                >
                  {Object.keys(ORDER_STATUS_LABEL).map((s) => (
                    <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">Belum ada pesanan.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CategoriesTab() {
  const { data: categories, isLoading } = api.admin.categories.useQuery();
  if (isLoading || !categories) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => (
        <div key={c.id} className="rounded-xl border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-zinc-100">{c.name}</p>
          <p className="mt-1 text-xs text-zinc-500">{c._count.products} produk</p>
        </div>
      ))}
    </div>
  );
}