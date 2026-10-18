"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Truck } from "lucide-react";
import { api } from "@/trpc/react";
import { Button, Field, inputClass } from "@/components/ui";
import { formatIDR, cn, getFieldErrors } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";
import type { CheckoutInput } from "@/server/validators";

export default function CheckoutPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const { data: cart, isLoading } = api.cart.get.useQuery();
  const shipping = api.checkout.shipping.useQuery();

  const [form, setForm] = useState<CheckoutInput>({
    recipient: "",
    phone: "081234567890",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const checkout = api.checkout.create.useMutation({
    onSuccess: async (data) => {
      toast.success("Pesanan berhasil dibuat!");
      await Promise.all([utils.cart.get.invalidate(), utils.cart.count.invalidate()]);
      router.replace(`/akun/pesanan/${data.orderId}`);
      router.refresh();
    },
    onError: (err) => {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
      } else {
        toast.error(err.message);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="container-x py-10">
        <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="mb-2 text-2xl font-bold">Keranjang kosong</h1>
        <p className="mb-6 text-sm text-zinc-500">Tambahkan produk ke keranjang sebelum checkout.</p>
        <Link href="/produk" className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 font-semibold text-zinc-950">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  const subtotal = cart.subtotal;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (shipping.data?.fee ?? SHIPPING_FEE);
  const total = subtotal + shippingFee;

  const handleField = <K extends keyof CheckoutInput>(key: K, value: CheckoutInput[K]) => {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const fields: { key: keyof CheckoutInput; label: string; type?: string; required?: boolean; placeholder?: string }[] = [
    { key: "recipient", label: "Nama Penerima", placeholder: "Nama lengkap", required: true },
    { key: "phone", label: "No. HP", type: "tel", placeholder: "081234567890", required: true },
    { key: "addressLine1", label: "Alamat", placeholder: "Jl. Raya No.123, RT/RW", required: true },
    { key: "city", label: "Kota/Kabupaten", placeholder: "Jakarta Selatan", required: true },
    { key: "province", label: "Provinsi", placeholder: "DKI Jakarta", required: true },
    { key: "postalCode", label: "Kode Pos", placeholder: "12345", required: true },
    { key: "notes", label: "Catatan (opsional)", placeholder: "Catatan untuk kurir..." },
  ];

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-3xl font-black tracking-tight">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <form
          id="checkout-form"
          onSubmit={(e) => {
            e.preventDefault();
            setErrors({});
            checkout.mutate(form);
          }}
          className="flex flex-col gap-6"
        >
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-100">
              <Truck className="size-4 text-brand" /> Alamat Pengiriman
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(({ key, label, type, required, placeholder }) => (
                <Field key={key} label={label} error={errors[key]} className={key === "addressLine1" || key === "notes" ? "sm:col-span-2" : ""}>
                  {key === "notes" ? (
                    <textarea
                      value={form[key]}
                      onChange={(e) => handleField(key, e.target.value)}
                      placeholder={placeholder}
                      rows={3}
                      className={cn(inputClass, "resize-none")}
                    />
                  ) : (
                    <input
                      type={type}
                      value={String(form[key])}
                      onChange={(e) => handleField(key, e.target.value)}
                      placeholder={placeholder}
                      required={required}
                      className={inputClass}
                    />
                  )}
                </Field>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-4 text-sm font-bold text-zinc-100">Ringkasan Pesanan</h2>
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.slug} className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill className="object-contain p-1" sizes="48px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">{item.name}</p>
                    <p className="text-xs text-zinc-500">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatIDR(item.priceAfterDiscount * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" size="lg" loading={checkout.isPending} className="w-full lg:hidden">
            Bayar {formatIDR(total)}
          </Button>
        </form>

        <div className="h-fit rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-24">
          <h2 className="mb-4 text-sm font-bold text-zinc-100">Ringkasan</h2>
          <div className="space-y-2 border-b border-line pb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Subtotal</span>
              <span>{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Pengiriman</span>
              <span className={shippingFee === 0 ? "font-semibold text-brand" : ""}>
                {shippingFee === 0 ? "GRATIS" : formatIDR(shippingFee)}
              </span>
            </div>
          </div>
          <div className="flex justify-between border-b border-line py-4 text-base font-bold">
            <span>Total</span>
            <span>{formatIDR(total)}</span>
          </div>
          <Button type="submit" form="checkout-form" size="lg" loading={checkout.isPending} className="hidden w-full lg:flex">
            <CheckCircle2 className="size-5" /> Bayar Sekarang
          </Button>
          <p className="mt-3 text-center text-[11px] text-zinc-500">
            Transfer bank manual. Konfirmasi otomatis via admin.
          </p>
          <Link href="/keranjang" className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-brand">
            <ArrowLeft className="size-3" /> Kembali ke keranjang
          </Link>
        </div>
      </div>
    </div>
  );
}