import catalogRouter from "@/server/routers/catalog";
import authRouter from "@/server/routers/auth";
import cartRouter from "@/server/routers/cart";
import checkoutRouter from "@/server/routers/checkout";
import accountRouter from "@/server/routers/account";
import adminRouter from "@/server/routers/admin";
import { router } from "@/server/trpc/trpc";

export const appRouter = router({
  auth: authRouter,
  catalog: catalogRouter,
  cart: cartRouter,
  checkout: checkoutRouter,
  account: accountRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;