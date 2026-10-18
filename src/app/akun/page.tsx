"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, PackageOpen, ArrowRight, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { useSession } from "@/app/providers";
import { Button, Badge } from "@/components/ui";
import { formatIDR, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = "orders" | "profile";

export default function AccountPage() {
  const router = useRouter();
  const { session, pending } = useSession();
  const [tab, setTab] = useState<Tab>("orders");

  const { data: orders, isLoading } = api.account.myOrders.useQuery(undefined, { enabled: !!session });
  const logout = api.auth.logout.useMutation({
    onSuccess: async () => {
      toast.success("Berhasil keluar");
      router.replace("/");
      router.refresh();
    },
  });

  if (pending) {
    return (
      <div className="container-x py-20">
        <div className="mx-auto h-32 w-full max-w-lg animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="mb-2 text-2xl font-bold">Silakan masuk</h1>
        <p className="mb-6 text-sm text-zinc-500">Kamu perlu login untuk mengakses halaman ini.</p>
        <Link href="/login" className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 font-semibold text-zinc-950">
          Masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-black tracking-tight">Akun Saya</h1>

      <div className="flex gap-2 border-b border-line pb-4">
        {([
          { id: "orders" as Tab, icon: PackageOpen, label: "Pesanan" },
          { id: "profile" as Tab, icon: UserCircle, label: "Profil" },
        ]).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
              tab === id ? "border-brand/60 bg-brand/10 text-brand" : "border-line text-zinc-300 hover:border-zinc-600 hover:text-zinc-50",
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
        <Button
          variant="danger"
          size="sm"
          onClick={() => logout.mutate()}
          loading={logout.isPending}
          className="ml-auto"
        >
          <LogOut className="size-4" /> Keluar
        </Button>
      </div>

      {tab === "orders" && (
        <section className="mt-6">
          <h2 className="mb-4 text-lg font-bold text-zinc-100">Riwayat Pesanan</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-2" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="flex flex-col gap-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/akun/pesanan/${order.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-zinc-600 hover:bg-surface-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-500">{order.id.slice(0, 8)}</span>
                      <Badge
                        tone={
                          order.status === "COMPLETED"
                            ? "success"
                            : order.status === "CANCELLED"
                              ? "danger"
                              : order.status === "SHIPPED"
                                ? "accent"
                                : "muted"
                        }
                      >
                        {ORDER_STATUS_LABEL[order.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-300">
                      {order.items.length} item — {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatIDR(order.totalAmount)}</p>
                    <ArrowRight className="mt-1 ml-auto size-4 text-zinc-500" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line py-12 text-center">
              <PackageOpen className="mx-auto mb-3 size-8 text-zinc-700" />
              <p className="text-sm text-zinc-400">Belum ada pesanan.</p>
              <Link href="/produk" className="mt-4 inline-block text-sm font-medium text-brand hover:text-lime-300">
                Mulai belanja
              </Link>
            </div>
          )}
        </section>
      )}

      {tab === "profile" && (
        <section className="mt-6 max-w-md">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="mb-5 flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-2xl bg-brand/15 text-2xl font-black text-brand">
                {session.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">{session.name}</h3>
                <p className="text-sm text-zinc-500">{session.email}</p>
              </div>
            </div>
            <dl className="space-y-3 border-t border-line pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Role</dt>
                <dd>
                  <Badge tone={session.role === "ADMIN" ? "brand" : "muted"}>
                    {session.role === "ADMIN" && <ShieldCheck className="size-3" />}
                    {session.role === "ADMIN" ? "Admin" : "Pembeli"}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Email</dt>
                <dd className="text-zinc-200">{session.email}</dd>
              </div>
            </dl>
          </div>
        </section>
      )}
    </div>
  );
}