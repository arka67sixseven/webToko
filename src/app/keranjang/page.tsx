"use client";

import Link from "next/link";
import { Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { api } from "@/trpc/react";
import { formatIDR } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";

export default function CartPage() {
  const utils = api.useUtils();
  const { data, isLoading } = api.cart.get.useQuery();
  const remove = api.cart.remove.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.cart.get.invalidate(), utils.cart.count.invalidate()]);
    },
  });
  const setQty = api.cart.setQuantity.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.cart.get.invalidate(), utils.cart.count.invalidate()]);
    },
  });

  const count = data?.count ?? 0;
  const subtotal = data?.subtotal ?? 0;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  return (
    <div className="container-x py-10">
      <h1 className="mb-2 text-3xl font-black tracking-tight">Keranjang</h1>
      <p className="mb-8 text-sm text-zinc-500">{count} item dalam keranjangmu</p>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-2" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line py-20 text-center">
              <ShoppingCart className="mx-auto mb-4 size-10 text-zinc-700" />
              <p className="text-sm font-semibold text-zinc-300">Keranjang masih kosong</p>
              <p className="mt-1 text-xs text-zinc-500">Yuk mulai belanja!</p>
              <Link
                href="/produk"
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-zinc-950 hover:bg-lime-300"
              >
                <ArrowLeft className="size-4" /> Mulai Belanja
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.items.map((item) => (
                <div
                  key={item.slug}
                  className="flex gap-4 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-zinc-700"
                >
                  <Link href={`/produk/${item.slug}`} className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain p-2"
                        sizes="96px"
                      />
                    )}
                    {!item.image && (
                      <span className="text-xl font-black text-zinc-700">TK</span>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/produk/${item.slug}`} className="text-sm font-semibold text-zinc-100 hover:text-brand line-clamp-2">
                        {item.name}
                      </Link>
                      <button
                        onClick={() => {
                          remove.mutate({ productSlug: item.slug });
                          toast.success(`${item.name} dihapus dari keranjang`);
                        }}
                        aria-label={`Hapus ${item.name}`}
                        className="shrink-0 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    {item.brand && <p className="text-xs text-zinc-500">{item.brand}</p>}
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-lg border border-line bg-surface-2">
                        <button
                          onClick={() =>
                            setQty.mutate({ productSlug: item.slug, quantity: Math.max(1, item.quantity - 1) })
                          }
                          className="grid size-9 place-items-center text-zinc-400 hover:text-zinc-100"
                          aria-label="Kurangi jumlah"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() =>
                            setQty.mutate({
                              productSlug: item.slug,
                              quantity: Math.min(item.quantity + 1, item.stock),
                            })
                          }
                          disabled={item.quantity >= item.stock}
                          className="grid size-9 place-items-center text-zinc-400 hover:text-zinc-100 disabled:opacity-40"
                          aria-label="Tambah jumlah"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm font-bold">{formatIDR(item.priceAfterDiscount * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {data && data.items.length > 0 && (
          <div className="h-fit rounded-2xl border border-line bg-surface p-5">
            <h2 className="mb-4 text-sm font-bold text-zinc-100">Ringkasan</h2>
            <div className="space-y-2 border-b border-line pb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Subtotal</span>
                <span className="font-medium">{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Pengiriman</span>
                <span className={shippingFee === 0 ? "font-semibold text-brand" : "font-medium"}>
                  {shippingFee === 0 ? "GRATIS" : formatIDR(shippingFee)}
                </span>
              </div>
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <p className="text-xs text-zinc-500">
                  Belanja {formatIDR(FREE_SHIPPING_THRESHOLD)} untuk gratis ongkir!
                </p>
              )}
            </div>
            <div className="flex justify-between border-b border-line py-4 text-base font-bold">
              <span>Total</span>
              <span>{formatIDR(total)}</span>
            </div>
            <Link
              href="/checkout"
              className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-bold text-zinc-950 hover:bg-lime-300"
            >
              Checkout
            </Link>
            <Link href="/produk" className="mt-3 block text-center text-xs font-medium text-zinc-500 hover:text-brand">
              Lanjut belanja
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}