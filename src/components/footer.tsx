import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

const nav = [
  { href: "/produk", label: "Semua Produk" },
  { href: "/login", label: "Masuk" },
  { href: "/daftar", label: "Daftar" },
  { href: "/akun", label: "Akun" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface/50">
      <div className="container-x grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-brand font-black text-zinc-950">TK</span>
            <span className="text-lg font-bold tracking-tight">{SITE_NAME}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
            Toko online laptop, PC jadi, dan komponen komputer. Produk lokal & impor,
            bergaransi, harga kompetitif.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Navigasi</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-zinc-500 transition-colors hover:text-brand">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Kategori</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {["Laptop", "Komponen", "PC Rakitan", "Monitor", "Aksesoris"].map((label) => (
              <li key={label}>
                <Link href={`/produk?category=${label.toLowerCase()}`} className="text-zinc-500 transition-colors hover:text-brand">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Layanan</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-500">
            <li>Gratis ongkir min. Rp1.000.000</li>
            <li>Garansi resmi semua produk</li>
            <li>Pembayaran transfer bank</li>
            <li>Admin: admin@tokokomputer.id</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} {SITE_NAME}. Dibangun dengan Next.js 16 & tRPC.
      </div>
    </footer>
  );
}