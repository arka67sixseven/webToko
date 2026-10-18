"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { Button, Field, inputClass } from "@/components/ui";
import { cn, getFieldErrors } from "@/lib/utils";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const utils = api.useUtils();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation =
    mode === "login"
      ? api.auth.login.useMutation()
      : api.auth.register.useMutation();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    mutation.mutate(
      { name: form.name, email: form.email, password: form.password },
      {
        onSuccess: async () => {
          toast.success(mode === "login" ? "Selamat datang kembali!" : "Akun berhasil dibuat");
          await Promise.all([
            utils.auth.me.invalidate(),
            utils.cart.count.invalidate(),
            utils.cart.get.invalidate(),
          ]);
          router.replace(next);
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
      },
    );
  };

  const isRegister = mode === "register";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {isRegister && (
        <Field label="Nama" error={errors.name}>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nama lengkap"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
          />
        </Field>
      )}
      <Field label="Email" error={errors.email}>
        <input
          className={inputClass}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="nama@email.com"
          autoComplete="email"
          required
        />
      </Field>
      <Field label="Password" error={errors.password}>
        <input
          className={inputClass}
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder={isRegister ? "Minimal 8 karakter, ada huruf & angka" : "Password"}
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={isRegister ? 8 : 1}
          maxLength={72}
        />
      </Field>
      <Button type="submit" size="lg" loading={mutation.isPending} className="mt-1 w-full">
        {isRegister ? "Buat Akun" : "Masuk"}
      </Button>
      <p className="text-center text-sm text-zinc-500">
        {isRegister ? (
          <>
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-brand hover:text-lime-300">
              Masuk di sini
            </Link>
          </>
        ) : (
          <>
            Belum punya akun?{" "}
            <Link href="/daftar" className="font-medium text-brand hover:text-lime-300">
              Daftar gratis
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

export function AuthCard({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  return (
    <div className={cn("container-x flex justify-center py-16 sm:py-24")}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-line bg-surface p-8">
          <div className="mb-6 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-brand font-black text-zinc-950 shadow-[0_0_30px_rgba(163,230,53,0.3)]">
              TK
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              {isRegister ? "Buat Akun Baru" : "Masuk ke Akun"}
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              {isRegister
                ? "Satu akun untuk belanja, pesanan, dan ulasan"
                : "Lanjutkan belanja sesi terakhirmu"}
            </p>
          </div>
          <AuthForm mode={mode} />
        </div>
        <p className="mt-4 text-center text-xs text-zinc-600">
          Demo akun: <span className="text-zinc-400">demo@tokokomputer.id / Demo#1234</span>
        </p>
      </div>
    </div>
  );
}