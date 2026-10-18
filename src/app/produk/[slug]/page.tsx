import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Truck, RotateCcw, Ban } from "lucide-react";
import { serverCaller } from "@/server/trpc/caller";
import { ProductImage, ProductCard } from "@/components/product-card";
import { AddToCart } from "@/components/add-to-cart";
import { ReviewForm } from "@/components/review-form";
import { Badge, Rating } from "@/components/ui";
import { formatIDR, cn, discountPrice } from "@/lib/utils";
import { ORIGIN_LABEL } from "@/lib/constants";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const caller = await serverCaller();
  const product = await caller.catalog.bySlug(slug).catch(() => null);
  if (!product) return { title: "Produk tidak ditemukan" };
  return {
    title: `${product.name} — ${product.brand ?? "TokoKomputer"}`,
    description: product.description?.slice(0, 160) ?? `${product.name} di TokoKomputer`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const caller = await serverCaller();
  const product = await caller.catalog.bySlug(slug).catch(() => null);
  if (!product) notFound();

  const discounted = product.priceAfterDiscount < product.price;
  const specs = product.specs as Record<string, string> | null;

  return (
    <div className="container-x py-8">
      <nav className="mb-6 text-xs text-zinc-500">
        <Link href="/" className="hover:text-brand">Beranda</Link>
        <span className="mx-1.5">/</span>
        <Link href="/produk" className="hover:text-brand">Produk</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/produk?category=${product.category.slug}`} className="hover:text-brand">
          {product.category.name}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-zinc-300">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface">
            <ProductImage
              src={product.images[0] ?? null}
              alt={product.name}
              priority
              className="aspect-square w-full"
            />
            <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
              {!!product.discountPercent && product.discountPercent > 0 && <Badge tone="brand">-{product.discountPercent}%</Badge>}
              {product.isNew && <Badge tone="accent">BARU</Badge>}
              {product.stock === 0 && <Badge tone="danger">Stok Habis</Badge>}
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(0, 4).map((img, i) => (
                <div key={img} className="relative overflow-hidden rounded-lg border border-line bg-surface">
                  <ProductImage src={img} alt={`${product.name} ${i + 1}`} className="aspect-square w-full" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            {product.brand && (
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                {product.brand}
              </p>
            )}
            <h1 className="mt-1.5 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              {product.name}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
              {product.rating ? (
                <span className="flex items-center gap-1.5">
                  <Rating value={product.rating} />
                  <span className="font-semibold text-amber-400">{product.rating.toFixed(1)}</span>
                  <span className="text-zinc-500">({product.reviewCount} ulasan)</span>
                </span>
              ) : (
                <span className="text-zinc-500">Belum ada ulasan</span>
              )}
              <Badge tone="muted">{ORIGIN_LABEL[product.origin]}</Badge>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-black tracking-tight text-zinc-50">
                {formatIDR(product.priceAfterDiscount)}
              </span>
              {discounted && (
                <span className="text-base text-zinc-500 line-through">{formatIDR(product.price)}</span>
              )}
            </div>
            {discounted && (
              <p className="mt-1.5 text-xs text-brand">
                Hemat {formatIDR(product.price - product.priceAfterDiscount)}
              </p>
            )}
          </div>

          <AddToCart slug={product.slug} name={product.name} stock={product.stock} />

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              { icon: ShieldCheck, label: "Garansi Resmi" },
              { icon: Truck, label: "Ongkir cepat" },
              { icon: RotateCcw, label: "Retur 7 hari" },
              { icon: Ban, label: "100% Asli" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 text-zinc-300">
                <Icon className="size-4 shrink-0 text-brand" />
                <span className="text-xs">{label}</span>
              </div>
            ))}
          </div>

          {product.description && (
            <div className="prose-sm">
              <h2 className="mb-2 text-sm font-semibold text-zinc-100">Deskripsi</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-400">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Specs */}
      {specs && Object.keys(specs).length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold tracking-tight">Spesifikasi</h2>
          <div className="overflow-hidden rounded-xl border border-line">
            {Object.entries(specs).map(([key, value], i) => (
              <div
                key={key}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 px-5 py-3 text-sm",
                  i % 2 === 0 ? "bg-surface" : "bg-surface-2/60",
                )}
              >
                <dt className="font-medium text-zinc-400">{key}</dt>
                <dd className="text-zinc-100">{String(value)}</dd>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="mb-4 text-xl font-bold tracking-tight">
            Ulasan Pembeli ({product.reviewCount})
          </h2>
          {product.reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line py-12 text-center">
              <p className="text-sm text-zinc-500">Belum ada ulasan untuk produk ini.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {product.reviews.map((r) => (
                <article key={r.id} className="rounded-xl border border-line bg-surface p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-brand/15 text-sm font-bold text-brand">
                        {r.user.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{r.user.name}</p>
                        {r.title && <p className="text-xs text-zinc-500">{r.title}</p>}
                      </div>
                    </div>
                    <Rating value={r.rating} size="sm" />
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-300">
                    {r.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
        <div>
          <ReviewForm productSlug={slug} />
        </div>
      </section>

      {/* Related */}
      {product.related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-bold tracking-tight">Produk Terkait</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {product.related.map((r) => (
              <ProductCard
                key={r.slug}
                product={{
                  ...r,
                  priceAfterDiscount: discountPrice(r.price, r.discountPercent),
                  rating: null,
                  sold: 0,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}