import { OrderStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/server/prisma";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { checkoutSchema } from "@/server/validators";
import { discountPrice } from "@/lib/utils";

const checkoutRouter = router({
  create: protectedProcedure.input(checkoutSchema).mutation(async ({ ctx, input }) => {
    const items = await prisma.cartItem.findMany({
      where: { userId: ctx.session.id },
      include: { product: true },
    });
    if (items.length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Keranjang masih kosong" });
    }

    return prisma.$transaction(async (tx) => {
      // Lock products for stock validation
      const productIds = [...new Set(items.map((i) => i.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      const productById = new Map(products.map((p) => [p.id, p]));

      for (const item of items) {
        const product = productById.get(item.productId);
        if (!product) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Produk tidak ditemukan" });
        }
        if (product.stock < item.quantity) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Stok ${product.name} tidak mencukupi`,
          });
        }
      }

      const subtotal = items.reduce(
        (acc, item) =>
          acc + discountPrice(item.product.price, item.product.discountPercent) * item.quantity,
        0,
      );
      const shippingFee = subtotal >= 1_000_000 ? 0 : 20000;
      const totalAmount = subtotal + shippingFee;

      const order = await tx.order.create({
        data: {
          userId: ctx.session.id,
          status: OrderStatus.PENDING_PAYMENT,
          totalAmount,
          shippingAddress: input,
          paymentMethod: "transfer",
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productPrice: discountPrice(item.product.price, item.product.discountPercent),
              quantity: item.quantity,
            })),
          },
        },
      });

      await Promise.all(
        items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          }),
        ),
      );

      await tx.cartItem.deleteMany({ where: { userId: ctx.session.id } });

      return {
        orderId: order.id,
        subtotal,
        shippingFee,
        totalAmount,
        currency: "IDR",
      };
    });
  }),

  shipping: protectedProcedure.query(async () => {
    return {
      fee: 20000,
      freeThreshold: 1_000_000,
    };
  }),
});

export default checkoutRouter;