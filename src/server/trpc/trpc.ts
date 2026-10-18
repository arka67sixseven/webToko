import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import type { SessionUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";

export type Context = {
  session: SessionUser | null;
  ip: string | null;
  resHeaders: Headers | null;
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const cause = error.cause;
    const zodError = cause instanceof ZodError ? cause : (cause as { zodError?: ZodError } | null)?.zodError;
    const fieldErrors = zodError?.flatten().fieldErrors ?? {};
    return {
      ...shape,
      message: error.message,
      data: {
        ...shape.data,
        ...(Object.keys(fieldErrors).length
          ? { zodError: { fieldErrors } }
          : {}),
      },
    };
  },
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

const authMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

const adminMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu" });
  }
  if (ctx.session.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Akses hanya untuk admin" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

const sensitiveRateLimitMiddleware = t.middleware(({ ctx, next, path, type }) => {
  // Endpoint sensitif: auth (semua), plus checkout & review (anti-spam).
  const isSensitiveMutation =
    path.includes("auth") || path === "checkout.create" || path === "catalog.addReview";
  if (type === "mutation" && isSensitiveMutation) {
    const key = `rl:${ctx.ip ?? "unknown"}:${path}`;
    const { allowed, retryAfterSec } = rateLimit(key, 8, 60_000);
    if (!allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Terlalu banyak percobaan. Coba lagi dalam ${retryAfterSec} detik.`,
      });
    }
  }
  return next({ ctx });
});

export const protectedProcedure = t.procedure.use(sensitiveRateLimitMiddleware).use(authMiddleware);
export const adminProcedure = t.procedure.use(sensitiveRateLimitMiddleware).use(adminMiddleware);