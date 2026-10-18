import Link from "next/link";
import { ArrowRight, BadgeCheck, Cpu, Package, ShieldCheck, Truck, Zap } from "lucide-react";
import { prisma } from "@/server/prisma";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { discountPrice } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";

export const revalidate = 60;

async function featuredSets() {
  const [featured, newArrivals, categories] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { isNew: true },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      include: {
        children: { orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } },
        _count: { select: { products: true } },
      },
    }),
  ]);
  const orderItems = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
  });
  const soldMap = new Map(orderItems.map((o) => [o.productId, o._sum.quantity ?? 0]));
  const ratings = await prisma.review.groupBy({
    by: ["productId"],
    where: { approved: true, productId: { in: [...featured, ...newArrivals].map((p) => p.id) } },
    _avg: { rating: true },
  });
  const ratingMap = new Map(ratings.map((r) => [r.productId, Math.round((r._avg.rating ?? 0) * 10) / 10]));

  const toCard = (p: (typeof featured)[number]): ProductCardData => ({
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    price: p.price,
    priceAfterDiscount: discountPrice(p.price, p.discountPercent),
    discountPercent: p.discountPercent,
    stock: p.stock,
    origin: p.origin,
    isNew: p.isNew,
    images: p.images,
    rating: ratingMap.get(p.id) ?? null,
    sold: soldMap.get(p.id) ?? 0,
  });

  return { featured: featured.map(toCard), newArrivals: newArrivals.map(toCard), categories };
}

export default async function HomePage() {
  const { featured, newArrivals, categories } = await featuredSets();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -right-40 -top-48 size-[34rem] rounded-full bg-brand/15 blur-[120px]" />
        <div className="pointer-events-none absolute -left-32 bottom-0 size-[24rem] rounded-full bg-accent/10 blur-[100px]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="container-x relative grid gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
              <Zap className="size-3.5" /> Toko Online PC Terpercaya
            </p>
            <h1 className="text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Semua Kebutuhan
              <br />
              <span className="bg-gradient-to-r from-brand to-cyan-300 bg-clip-text text-transparent">
                PC & Komponen
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-400 sm:text-lg">
              Laptop, PC rakitan, dan komponen asli — produk lokal & impor dengan garansi
              resmi, harga bersaing, dan pengiriman cepat ke seluruh Indonesia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/produk"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 font-semibold text-zinc-950 transition-all hover:bg-lime-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Belanja Sekarang <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/produk?origin=IMPORTED"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-line px-6 font-semibold text-zinc-200 transition-colors hover:border-brand/50 hover:text-brand"
              >
                Produk Impor
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                { label: "Produk Asli", value: "Garansi Resmi" },
                { label: "Produk Ada", value: "25+ Item" },
                { label: "Pengiriman", value: "1–3 Hari" },
              ].map((s) => (
                <div key={s.label} className="border-l border-line pl-3">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{s.label}</dt>
                  <dd className="mt-0.5 text-sm font-bold text-zinc-100">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero visual */}
          <div className="perspective relative hidden lg:block">
            <div className="glass-card relative mx-auto max-w-md border border-line bg-surface/60 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Cpu className="size-4 text-brand" /> NVIDIA GeForce RTX 4060
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Stok: 12</span>
              </div>
              <div className="grid aspect-[4/3] place-items-center rounded-xl bg-surface-2">
                <div className="relative grid size-40 place-items-center">
                  <div className="absolute inset-0 rounded-2xl bg-brand/10 blur-2xl" />
                  <svg viewBox="0 0 160 160" className="relative w-40 drop-shadow-[0_0_30px_rgba(163,230,53,0.35)]" aria-hidden>
                    <rect x="10" y="30" width="140" height="100" rx="10" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
                    <circle cx="45" cy="80" r="22" fill="#a3e635" />
                    <circle cx="80" cy="80" r="26" fill="#22d3ee" opacity=".9" />
                    <circle cx="115" cy="80" r="20" fill="#fbbf24" />
                    <rect x="70" y="130" width="20" height="16" fill="#3f3f46" />
                    <circle cx="80" cy="140" r="6" fill="#a3e635" />
                    <text x="80" y="55" textAnchor="middle" fontSize="9" fill="#a1a1aa" fontFamily="sans-serif">RTX 4060</text>
                  </svg>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">Rp4.999.000</p>
                  <p className="text-xs text-zinc-500">Garansi resmi 2 tahun</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <BadgeCheck className="size-3.5" /> Siap Kirim
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b border-line">
        <div className="container-x grid gap-px sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Garansi Resmi", desc: "Semua produk bergaransi distributor & resmi." },
            { icon: Truck, title: "Gratis Ongkir", desc: "Min. belanja Rp1.000.000 untuk pengiriman gratis." },
            { icon: Package, title: "Produk Asli 100%", desc: "Lokal & impor, langsung dari supplier tepercaya." },
            { icon: Zap, title: "Proses Cepat", desc: "Pesanan diproses & dikirim di hari yang sama." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3.5 py-7">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-brand">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-x py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Kategori Produk</h2>
            <p className="mt-1 text-sm text-zinc-500">Jelajahi semua kebutuhan rig-mu</p>
          </div>
          <Link href="/produk" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-lime-300">
            Lihat semua <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 12).map((cat) => {
            const count =
              cat._count.products +
              cat.children.reduce((acc, ch) => acc + ch._count.products, 0);
            return (
              <Link
                key={cat.slug}
                href={`/produk?category=${cat.slug}`}
                className="group rounded-xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-brand/10 text-brand transition-transform group-hover:scale-110">
                  <Cpu className="size-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-zinc-100">{cat.name}</h3>
                <p className="mt-1 text-xs text-zinc-500">{count} produk</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured products */}
      <section className="border-y border-line bg-surface/40">
        <div className="container-x py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Pilihan Utama</h2>
              <p className="mt-1 text-sm text-zinc-500">Produk paling direkomendasikan bulan ini</p>
            </div>
            <Link href="/produk?sort=populer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-lime-300">
              Lihat lebih banyak <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-x py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Baru Datang</h2>
            <p className="mt-1 text-sm text-zinc-500">Jangan lewatkan produk-produk terbaru</p>
          </div>
          <Link href="/produk" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-lime-300">
            Langsung Cek <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {newArrivals.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pb-16">
        <div className="relative overflow-hidden rounded-2xl border border-brand/25 bg-gradient-to-br from-surface-2 to-surface p-8 sm:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand/15 blur-[90px]" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Butuh PC Rakitan Sesuai Budget?{" "}
                <span className="text-brand">Konsul Gratis!</span>
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
                Tim kami membantu meracik spesifikasi terbaik untuk gaming, editing, atau
                kerja kantoran — gratis, tanpa biaya tersembunyi.
              </p>
            </div>
            <Link
              href="/produk"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-brand px-6 font-semibold text-zinc-950 transition-all hover:bg-lime-300"
            >
              Jelajahi {SITE_NAME} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}