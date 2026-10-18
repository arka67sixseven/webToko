import { OrderStatus, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { adminProcedure, router } from "@/server/trpc/trpc";
import { adminProductSchema } from "@/server/validators";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const idSchema = z.object({ id: z.string().min(1) });
const orderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["PENDING_PAYMENT", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"]),
});

const adminRouter = router({
  stats: adminProcedure.query(async () => {
    const [productCount, orderCount, userCount, revenueAgg, lowStock] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        where: { status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.COMPLETED] } },
        _sum: { totalAmount: true },
      }),
      prisma.product.count({ where: { stock: { lte: 5 } } }),
    ]);
    return {
      productCount,
      orderCount,
      userCount,
      revenue: revenueAgg._sum.totalAmount ?? 0,
      lowStock,
    };
  }),

  product: router({
    byId: adminProcedure.input(idSchema).query(async ({ input }) => {
      return prisma.product.findUnique({
        where: { id: input.id },
        include: { category: true },
      });
    }),

    save: adminProcedure.input(adminProductSchema).mutation(async ({ input }) => {
      const category = await prisma.category.findUnique({ where: { slug: input.categorySlug } });
      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kategori tidak ditemukan" });
      }
      const data = {
        name: input.name,
        brand: input.brand || null,
        description: input.description || null,
        price: input.price,
        currency: input.currency,
        stock: input.stock,
        origin: input.origin,
        categoryId: category.id,
        featured: input.featured,
        isNew: input.isNew,
        discountPercent: input.discountPercent || 0,
        specs: input.specs,
      } satisfies Prisma.ProductUncheckedUpdateInput;

      if (input.id) {
        return prisma.product.update({ where: { id: input.id }, data });
      }
      const slug = slugify(input.name);
      return prisma.product.create({ data: { ...data, slug, images: [] } });
    }),

    delete: adminProcedure.input(idSchema).mutation(async ({ input }) => {
      const related = await prisma.cartItem.count({ where: { productId: input.id } });
      if (related > 0) {
        await prisma.cartItem.deleteMany({ where: { productId: input.id } });
      }
      await prisma.product.delete({ where: { id: input.id } });
      return { ok: true };
    }),
  }),

  orders: router({
    list: adminProcedure.query(async () => {
      return prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
      });
    }),

    updateStatus: adminProcedure.input(orderStatusSchema).mutation(async ({ input }) => {
      return prisma.order.update({
        where: { id: input.orderId },
        data: { status: input.status },
      });
    }),
  }),

  categories: adminProcedure.query(async () => {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
  }),
});

export default adminRouter;