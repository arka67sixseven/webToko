<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- SECURITY-PROTOCOL:START (dikelola manual — pertahankan blok ini) -->

# 🔐 Protokol Keamanan & Workflow Audit (WAJIB)

Stack: Next.js 16 App Router · tRPC v11 · Prisma 6 + PostgreSQL · Zod 4 · jose JWT (HS256) · bcryptjs · Tailwind 4.
File kunci: `src/server/trpc/trpc.ts` (procedure) · `src/server/auth.ts` (sesi) · `src/server/validators.ts` (Zod) · `src/server/rate-limit.ts`.

## Aturan kode (non-negotiable)

1. **Validasi** — setiap procedure yang menerima input WAJIB `.input(schema)` dari `src/server/validators.ts`. Schema baru ditulis di file itu, bukan inline di router.
2. **Authz via procedure** — data user → `protectedProcedure`, admin → `adminProcedure`. Jangan bikin cek login/role manual di dalam handler.
3. **Ownership check (anti-IDOR)** — setiap query/mutation atas data milik user (keranjang, order, alamat, ulasan, profil) WAJIB memfilter dengan `ctx.session.id` atau membandingkan `row.userId === ctx.session.id` sebelum read/update/delete. Ini celah #1 aplikasi toko.
4. **Jangan percaya client** — harga, diskon, stok, role, `totalAmount`: selalu hitung ulang di server dari data DB (contoh benar: `src/server/routers/checkout.ts`).
5. **Database** — pakai Prisma. Kalau butuh `$queryRaw`, WAJIB tagged template (parameterized). Dilarang string concatenation.
6. **Secret** — hanya dari `process.env`; tidak ada fallback secret hardcoded di jalur production; `NEXT_PUBLIC_*` hanya untuk nilai yang memang publik; `.env*` tidak pernah di-commit.
7. **Sesi** — cookie `httpOnly` + `sameSite` + `secure` di production (lihat `sessionCookieOptions`). Token tidak pernah disimpan di localStorage. Jangan menambah endpoint yang mengembalikan token.
8. **Rate limit** — endpoint sensitif (auth, checkout, review, ubah password) lewat `rateLimit()` dengan key unik per ip + aksi.
9. **Error handling** — pesan error auth tidak membocorkan info akun (pakai pesan generik). Detail error hanya di-log server-side, bukan dikirim ke client.
10. **Logging** — dilarang `console.log` berisi password, token, atau isi order.
11. **Pre-commit & CI** — hook gitleaks aktif (via `git config core.hooksPath scripts/hooks`); jangan `git commit --no-verify` kecuali sadar. Setiap push harus melewati CI (`.github/workflows/ci.yml`) dan berakhir hijau.

## Workflow 4-pass setiap fitur selesai

| Pass | Aksi |
|---|---|
| 1. Build | vibecode bebas |
| 2. Mesin | `npm run typecheck && npm run lint && npm run security` |
| 3. Audit | **Sesi baru** (context bersih) → command `/security-audit` atau skill `security-reviewer` — audit diff fitur terakhir |
| 4. Adversarial | Fitur auth/uang/admin → skill `penetration-tester` + browser MCP (Playwright): login user A, coba akses data user B; login user biasa, coba akses admin |

Prompt audit siap pakai:

> Audit keamanan fitur [X]. Cari: IDOR (ganti ID milik user lain), missing authz, input tanpa Zod, injection, XSS, secret hardcoded, rate-limit hilang. Untuk setiap temuan tuliskan file:line, cara eksploitasi, dampak, dan fix. Jangan bilang "aman" sebelum menuliskan area apa yang diperiksa dan apa yang TIDAK diperiksa.

## Definition of Done fitur baru

- [ ] `npm run typecheck` + `npm run lint` bersih
- [ ] `npm run security` bersih, atau setiap temuan didokumentasikan alasan penerimaannya
- [ ] Zod schema + procedure type + ownership check benar
- [ ] Pass 3 (dan pass 4 untuk fitur sensitif) dijalankan di sesi baru
- [ ] Tidak ada secret / data sensitif ikut di-commit
- [ ] CI hijau (setelah repo punya remote GitHub)

<!-- SECURITY-PROTOCOL:END -->
