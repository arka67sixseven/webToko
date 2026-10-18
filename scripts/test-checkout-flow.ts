/**
 * Integration test alur checkout (PENDING_PAYMENT → verifikasi admin).
 *
 * Jalankan:
 *   export DATABASE_URL=$(grep -E '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '"')
 *   npx -y tsx scripts/test-checkout-flow.ts
 *
 * Test ini membuat user & order sementara, lalu membersihkannya sendiri.
 * Aman dijalankan di DB dev. JANGAN dijalankan di DB production.
 */
import { prisma } from "@/server/prisma";
import { appRouter } from "@/server/trpc/router";
import { createCallerFactory } from "@/server/trpc/trpc";
import type { SessionUser } from "@/server/auth";

const createCaller = createCallerFactory(appRouter);
const TEST_EMAIL = "test-checkout-flow@local.test";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

async function cleanup() {
  await prisma.orderItem.deleteMany({ where: { order: { user: { email: TEST_EMAIL } } } });
  await prisma.order.deleteMany({ where: { user: { email: TEST_EMAIL } } });
  await prisma.cartItem.deleteMany({ where: { user: { email: TEST_EMAIL } } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

async function main() {
  await cleanup();

  const product = await prisma.product.findFirst({ where: { stock: { gt: 1 } }, orderBy: { id: "asc" } });
  assert(product, "produk dengan stok tersedia ditemukan");
  const stockBefore = product.stock;

  const user = await prisma.user.create({
    data: { email: TEST_EMAIL, name: "Test Checkout", passwordHash: "test-not-a-real-hash", role: "USER" },
  });
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  assert(adminUser, "admin ditemukan (hasil seed)");

  const userSession: SessionUser = { id: user.id, email: user.email, name: user.name, role: "USER" };
  const adminSession: SessionUser = { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: "ADMIN" };
  const userCaller = createCaller({ session: userSession, ip: "test-user", resHeaders: null });
  const admin = createCaller({ session: adminSession, ip: "test-admin", resHeaders: null });

  await prisma.cartItem.create({ data: { userId: user.id, productId: product.id, quantity: 2 } });

  console.log("\n1) checkout.create → PENDING_PAYMENT, stok berkurang (reserve)");
  const result = await userCaller.checkout.create({
    recipient: "Test Penerima",
    phone: "081234567890",
    addressLine1: "Jl. Test No. 1",
    addressLine2: "",
    city: "Bandung",
    province: "Jawa Barat",
    postalCode: "40111",
    notes: "",
  });
  const order = await prisma.order.findUnique({ where: { id: result.orderId } });
  assert(order?.status === "PENDING_PAYMENT", `status order = ${order?.status}`);
  const afterCheckout = await prisma.product.findUnique({ where: { id: product.id } });
  assert(afterCheckout?.stock === stockBefore - 2, `stok ${stockBefore} → ${afterCheckout?.stock}`);

  console.log("\n2) transisi ilegal PENDING_PAYMENT → SHIPPED harus DITOLAK server");
  let rejected = false;
  try {
    await admin.admin.orders.updateStatus({ orderId: result.orderId, status: "SHIPPED" });
  } catch {
    rejected = true;
  }
  assert(rejected, "SHIPPED dari PENDING_PAYMENT ditolak");

  console.log("\n3) PENDING_PAYMENT → PAID → CANCELLED, stok kembali");
  const paid = await admin.admin.orders.updateStatus({ orderId: result.orderId, status: "PAID" });
  assert(paid.status === "PAID", "admin bisa konfirmasi PAID");
  const cancelled = await admin.admin.orders.updateStatus({ orderId: result.orderId, status: "CANCELLED" });
  assert(cancelled.status === "CANCELLED", "admin bisa membatalkan");
  const afterCancel = await prisma.product.findUnique({ where: { id: product.id } });
  assert(afterCancel?.stock === stockBefore, `stok kembali ke ${afterCancel?.stock}`);

  console.log("\n4) CANCELLED bersifat final (tidak bisa diaktifkan lagi)");
  rejected = false;
  try {
    await admin.admin.orders.updateStatus({ orderId: result.orderId, status: "PAID" });
  } catch {
    rejected = true;
  }
  assert(rejected, "PAID dari CANCELLED ditolak");

  console.log("\n5) user biasa tidak bisa memakai endpoint admin");
  rejected = false;
  try {
    await userCaller.admin.orders.updateStatus({ orderId: result.orderId, status: "PAID" });
  } catch {
    rejected = true;
  }
  assert(rejected, "user biasa ditolak dari admin procedure");

  console.log("\n✅ SEMUA TES LULUS");
}

main()
  .catch((e) => {
    console.error("\n❌ GAGAL:", e.message ?? e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
  });
