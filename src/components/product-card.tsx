import Link from "next/link";
import Image from "next/image";
import { cn, formatIDR } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { ORIGIN_LABEL } from "@/lib/constants";

export type ProductCardData = {
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  priceAfterDiscount: number;
  discountPercent: number | null;
  stock: number;
  origin: "LOCAL" | "IMPORTED";
  featured?: boolean;
  isNew?: boolean;
  images: string[];
  rating: number | null;
  sold?: number;
};

export function ProductImage({
  src,
  alt,
  className,
  priority,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className={cn("grid place-items-center bg-surface-2", className)}>
        <span className="text-4xl font-black tracking-tighter text-zinc-700">TK</span>
      </div>
    );
  }
  return (
    <div className={cn("relative grid place-items-center bg-surface-2", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 640px) 50vw, 33vw"
        className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
      />
    </div>
  );
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const discounted = product.priceAfterDiscount < product.price;
  return (
    <Link
      href={`/produk/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-600 hover:shadow-[0_8px_40px_-12px_rgba(163,230,53,0.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      aria-label={product.name}
    >
      <div className="relative">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          className="aspect-[4/3] w-full"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.discountPercent && product.discountPercent > 0 ? (
            <Badge tone="brand">-{product.discountPercent}%</Badge>
          ) : product.isNew ? (
            <Badge tone="accent">BARU</Badge>
          ) : null}
          {product.origin === "IMPORTED" ? (
            <Badge tone="muted">{ORIGIN_LABEL[product.origin]}</Badge>
          ) : null}
        </div>
        {product.stock === 0 && (
          <div className="absolute inset-0 grid place-items-center bg-zinc-950/70 backdrop-blur-[2px]">
            <Badge tone="danger" className="text-sm">Stok Habis</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          {product.brand || "TokoKomputer"}
        </p>
        <h3 className="line-clamp-2 min-h-[2.6rem] text-sm font-medium leading-snug text-zinc-100">
          {product.name}
        </h3>
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1">
          {product.rating ? (
            <span className="text-xs font-semibold text-amber-400">★ {product.rating.toFixed(1)}</span>
          ) : null}
          {typeof product.sold === "number" && product.sold > 0 ? (
            <span className="text-xs text-zinc-500">terjual {product.sold}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-bold tracking-tight text-zinc-50">
            {formatIDR(product.priceAfterDiscount)}
          </span>
          {discounted && (
            <span className="text-xs text-zinc-500 line-through">
              {formatIDR(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}