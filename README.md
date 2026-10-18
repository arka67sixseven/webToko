# webToko — TokoKomputer 🛒

E-commerce UMKM: **Next.js 16** (App Router) · **tRPC v11** · **Prisma 6 + PostgreSQL** · Zod 4 · auth sesi JWT (jose) · Tailwind 4.

![CI](https://github.com/arka67sixseven/webToko/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/arka67sixseven/webToko/actions/workflows/codeql.yml/badge.svg)

## Fitur

- Katalog: kategori, pencarian, detail produk, review
- Keranjang + checkout transfer bank manual (order `PENDING_PAYMENT`, verifikasi oleh admin)
- Akun: riwayat pesanan, alamat, wishlist
- Admin: kelola produk & kategori, verifikasi pembayaran, update status pengiriman (transisi status tervalidasi di server; stok otomatis kembali saat pesanan dibatalkan)

## Menjalankan secara lokal

Prasyarat: Node.js 20+, PostgreSQL.

```bash
cp .env.example .env          # isi DATABASE_URL + JWT_SECRET (min. 32 karakter)
npm install
npx prisma migrate deploy     # atau npx prisma migrate dev untuk dev
npm run db:seed               # data contoh: kategori, produk, user (termasuk admin)
npm run dev                   # buka http://localhost:3000
```

## Keamanan 🔐

Proyek ini memakai alur kerja keamanan berlapis — temuan & keputusan di [`SECURITY.md`](SECURITY.md), protokol kerja agent di [`AGENTS.md`](AGENTS.md).

- `npm run security` — npm audit (allowlist-aware) + gitleaks + semgrep; exit ≠ 0 saat ada temuan
- Pre-commit hook **gitleaks** — commit berisi secret diblokir (aktif via `git config core.hooksPath scripts/hooks`)
- **CI** — typecheck, lint, build (dengan service PostgreSQL), audit, gitleaks, semgrep; semua action di-pin ke commit SHA
- **CodeQL** (code scanning mingguan) + **Dependabot** (update mingguan dengan cooldown 7 hari)
- Uji alur checkout: `npx tsx scripts/test-checkout-flow.ts` (membuat user & order sementara di DB dev, membersihkan dirinya sendiri)

## Scripts

| Perintah | Fungsi |
|---|---|
| `npm run dev` | development server |
| `npm run build` / `npm start` | build & jalankan produksi |
| `npm run typecheck` | TypeScript strict, tanpa emit |
| `npm run lint` | ESLint |
| `npm run security` | audit keamanan lengkap (argumen: `audit` / `secrets` / `sast`) |
| `npm run db:seed` | isi data contoh |
