import { z } from "zod";
import { prisma } from "@/server/prisma";
import { protectedProcedure, router } from "@/server/trpc/trpc";

const accountRouter = router({
  myOrders: protectedProcedure.query(async ({ ctx }) => {
    return prisma.order.findMany({
      where: { userId: ctx.session.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  }),

  orderDetail: protectedProcedure
    .input(z.object({ orderId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return prisma.order.findFirst({
        where: { id: input.orderId, userId: ctx.session.id },
        include: { items: true },
      });
    }),

  addresses: protectedProcedure.query(async ({ ctx }) => {
    return prisma.address.findMany({
      where: { userId: ctx.session.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }),
});

export default accountRouter;