import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Daftar" };
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return <AuthCard mode="register" />;
}