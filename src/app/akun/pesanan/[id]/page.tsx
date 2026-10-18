"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { useSession } from "@/app/providers";
import { Button, Badge, Skeleton } from "@/components/ui";
import { formatIDR, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABEL } from "@/lib/constants";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { session } = useSession();

  const { data: order, isLoading } = api.account.orderDetail.useQuery(
    { orderId },
    { enabled: !!session },
  );

  const isAdmin = session?.role === "ADMIN";
  const nextStatuses: Record<string, string[]> = {
    PENDING_PAYMENT: ["PAID", "CANCELLED"],
    PAID: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
  };

  const updateStatus = api.admin.orders.updateStatus.useMutation({
    onSuccess: async () => {
      toast.success("Status pesanan diperbarui");
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="container-x py-10">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="mb-2 text-2xl font-bold">Pesanan tidak ditemukan</h1>
        <Link href="/akun" className="mt-4 inline-block text-sm font-medium text-brand hover:text-lime-300">
          Kembali ke akun
        </Link>
      </div>
    );
  }

  const status =
    order.status === "COMPLETED"
      ? "success"
      : order.status === "CANCELLED"
        ? "danger"
        : order.status === "SHIPPED"
          ? "accent"
          : "muted";

  const addr = order.shippingAddress as Record<string, string>;

  return (
    <div className="container-x py-10">
      <Link
        href="/akun"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-brand"
      >
        <ArrowLeft className="size-4" /> Kembali ke akun
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-black tracking-tight">Pesanan {order.id.slice(0, 8)}</h1>
        <Badge tone={status}>{ORDER_STATUS_LABEL[order.status]}</Badge>
      </div>

      {isAdmin && nextStatuses[order.status]?.length ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {nextStatuses[order.status].map((s) => (
            <Button
              key={s}
              variant={s === "CANCELLED" ? "danger" : "secondary"}
              size="sm"
              onClick={() => updateStatus.mutate({ orderId: order.id, status: s as never })}
              loading={updateStatus.isPending}
            >
              Ubah ke {ORDER_STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Address */}
          {addr && (
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-2 text-sm font-bold text-zinc-100">Alamat Pengiriman</h2>
              <div className="text-sm text-zinc-300">
                <p className="font-medium">{addr.recipient}</p>
                <p>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}</p>
                <p>{addr.city}, {addr.province} {addr.postalCode}</p>
                {addr.phone && <p className="mt-1 text-zinc-500">Telp: {addr.phone}</p>}
                {addr.notes && <p className="mt-1 text-zinc-500">Catatan: {addr.notes}</p>}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="mb-3 text-sm font-bold text-zinc-100">Item ({order.items.length})</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-line last:border-0 pb-3 last:pb-0">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-2">
                    <Package className="size-5 text-zinc-600" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">{item.productName}</p>
                    <p className="text-xs text-zinc-500">x{item.quantity} @ {formatIDR(item.productPrice)}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatIDR(item.productPrice * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-24">
          <h2 className="mb-3 text-sm font-bold text-zinc-100">Ringkasan</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Status</span>
              <Badge tone={status}>{ORDER_STATUS_LABEL[order.status]}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Tanggal</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Metode Pembayaran</span>
              <span className="capitalize text-zinc-200">{order.paymentMethod}</span>
            </div>
            <div className="border-t border-line pt-3 mt-3 flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatIDR(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}