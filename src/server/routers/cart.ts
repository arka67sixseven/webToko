import { TRPCError } from "@trpc/server";
import { prisma } from "@/server/prisma";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { cartSetSchema } from "@/server/validators";
import { discountPrice } from "@/lib/utils";

async function resolveProduct(slug: string) {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Produk tidak ditemukan" });
  return product;
}

const cartRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const items = await prisma.cartItem.findMany({
      where: { userId: ctx.session.id },
      include: { product: true },
      orderBy: { createdAt: "asc" },
    });
    const subtotal = items.reduce(
      (acc, item) => acc + discountPrice(item.product.price, item.product.discountPercent) * item.quantity,
      0,
    );
    return {
      items: items.map((item) => ({
        productId: item.product.id,
        slug: item.product.slug,
        name: item.product.name,
        brand: item.product.brand,
        image: item.product.images[0] ?? null,
        stock: item.product.stock,
        quantity: item.quantity,
        price: item.product.price,
        discountPercent: item.product.discountPercent,
        priceAfterDiscount: discountPrice(item.product.price, item.product.discountPercent),
      })),
      subtotal,
      count: items.reduce((acc, item) => acc + item.quantity, 0),
    };
  }),

  count: protectedProcedure.query(async ({ ctx }) => {
    const agg = await prisma.cartItem.aggregate({
      where: { userId: ctx.session.id },
      _sum: { quantity: true },
    });
    return agg._sum.quantity ?? 0;
  }),

  add: protectedProcedure.input(cartSetSchema).mutation(async ({ ctx, input }) => {
    const product = await resolveProduct(input.productSlug);
    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: ctx.session.id, productId: product.id } },
    });
    const newQty = Math.min((existing?.quantity ?? 0) + input.quantity, product.stock, 99);
    if (newQty < 1) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Stok produk tidak tersedia" });
    }
    await prisma.cartItem.upsert({
      where: { userId_productId: { userId: ctx.session.id, productId: product.id } },
      update: { quantity: newQty },
      create: { userId: ctx.session.id, productId: product.id, quantity: newQty },
    });
    return { ok: true, quantity: newQty };
  }),

  setQuantity: protectedProcedure.input(cartSetSchema).mutation(async ({ ctx, input }) => {
    const product = await resolveProduct(input.productSlug);
    const qty = Math.min(input.quantity, product.stock);
    if (qty < 1) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Jumlah minimal 1" });
    }
    await prisma.cartItem.upsert({
      where: { userId_productId: { userId: ctx.session.id, productId: product.id } },
      update: { quantity: qty },
      create: { userId: ctx.session.id, productId: product.id, quantity: qty },
    });
    return { ok: true };
  }),

  remove: protectedProcedure
    .input(cartSetSchema.pick({ productSlug: true }))
    .mutation(async ({ ctx, input }) => {
      const product = await resolveProduct(input.productSlug);
      await prisma.cartItem.deleteMany({
        where: { userId: ctx.session.id, productId: product.id },
      });
      return { ok: true };
    }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.cartItem.deleteMany({ where: { userId: ctx.session.id } });
    return { ok: true };
  }),
});

export default cartRouter;