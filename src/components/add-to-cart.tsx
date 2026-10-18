"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { useSession } from "@/app/providers";
import { Button } from "@/components/ui";
import { cn, clampInt } from "@/lib/utils";

export function AddToCart({
  slug,
  name,
  stock,
  className,
}: {
  slug: string;
  name: string;
  stock: number;
  className?: string;
}) {
  const router = useRouter();
  const { session } = useSession();
  const [qty, setQty] = useState(1);
  const utils = api.useUtils();

  const add = api.cart.add.useMutation({
    onSuccess: () => {
      toast.success(`${name} masuk keranjang`, {
        description: qty > 1 ? `${qty} item berhasil ditambahkan` : undefined,
        action: { label: "Lihat", onClick: () => router.push("/keranjang") },
      });
      utils.cart.count.invalidate();
      utils.cart.get.invalidate();
      utils.catalog.bySlug.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
      if (error.data?.httpStatus === 401) {
        router.push(`/login?next=${encodeURIComponent(`/produk/${slug}`)}`);
      }
    },
  });

  const out = stock === 0;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-zinc-400">Jumlah</span>
        <div className="flex items-center rounded-lg border border-line bg-surface">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1 || out}
            aria-label="Kurangi jumlah"
            className="grid size-10 place-items-center text-zinc-400 hover:text-zinc-50 disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</span>
          <button
            onClick={() => setQty((q) => clampInt(q + 1, 1, stock))}
            disabled={qty >= stock || out}
            aria-label="Tambah jumlah"
            className="grid size-10 place-items-center text-zinc-400 hover:text-zinc-50 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <span className="text-xs text-zinc-500">Stok: {stock}</span>
      </div>

      <Button
        size="lg"
        disabled={out}
        loading={add.isPending}
        onClick={() => {
          if (!session) {
            toast.info("Silakan masuk untuk menambahkan ke keranjang");
            router.push("/login");
            return;
          }
          add.mutate({ productSlug: slug, quantity: qty });
        }}
      >
        <ShoppingCart className="size-5" />
        {out ? "Stok Habis" : "Masukkan Keranjang"}
      </Button>
    </div>
  );
}