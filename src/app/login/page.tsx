import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Masuk" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <AuthCard mode="login" />;
}