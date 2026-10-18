# SECURITY NOTES — webToko

Catatan temuan keamanan & keputusan. Diperbarui: 2026-10-18.
Cara menjalankan audit: `npm run security` (npm audit + gitleaks + semgrep) — exit code ≠ 0 artinya ada temuan.

## ✅ Sudah diperbaiki

| Tanggal | Temuan | Severity | Fix |
|---|---|---|---|
| 2026-10-18 | Next.js 16.3.5: RCE di `next/og` ImageResponse + 6 advisory lain (cache poisoning, SSRF, info disclosure) | Critical | Upgrade ke `next@16.4.2` |
| 2026-10-18 | `sharp`: CVE librsvg · `source-map-js`: DoS via source map | High | `npm audit fix` (keduanya terpatch) |
| 2026-10-18 | `src/server/auth.ts`: fallback `JWT_SECRET ?? "dev-insecure-secret"` — sesi bisa dipalsukan jika env lupa di-set | High | Guard: production wajib `JWT_SECRET` ≥ 32 karakter, app menolak start |

## ⚠️ Diterima sadar (accepted risk) — tinjau ulang berkala

| Tanggal | Temuan | Kenapa diterima | Kapan tinjau ulang |
|---|---|---|---|
| 2026-10-18 | `braces` (via eslint-config-next → fast-glob → micromatch) | Dev-only (ESLint), tidak masuk bundle produksi; `3.0.3` masih versi terbaru, belum ada patch | Saat eslint-config-next / micromatch rilis update |
| 2026-10-18 | `deepmerge-ts` <8 (via prisma CLI → @prisma/config) | CLI-only (dev/build), input tidak dikontrol attacker; fix butuh Prisma 7 (breaking) | Saat upgrade Prisma 7.x |

## 📋 Keputusan terbuka (belum diubah — butuh keputusan produk)

1. `src/server/routers/checkout.ts`: order dibuat dengan status `PAID` tanpa verifikasi pembayaran. Sebelum dipakai publik: tambahkan flow pembayaran / verifikasi transfer / status `PENDING` + konfirmasi admin.
2. `src/server/rate-limit.ts`: rate limiter in-memory (per-instance, reset saat restart). Cukup untuk dev / single instance; pindah ke Redis (mis. Upstash) sebelum scale.

## 📜 Aturan

- Jangan pernah commit `.env` — dijaga `.gitignore` + gitleaks di `npm run security`.
- Jalankan `npm run security` sebelum deploy; workflow 4-pass ada di `AGENTS.md`.
