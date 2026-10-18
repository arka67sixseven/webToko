import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/server/prisma";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/server/auth";
import { protectedProcedure, publicProcedure, router } from "@/server/trpc/trpc";
import { loginSchema, registerSchema } from "@/server/validators";

function setSessionCookie(resHeaders: Headers | null, token: string) {
  resHeaders?.append("Set-Cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionCookieOptions.maxAge}`);
}

const authRouter = router({
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "Email sudah terdaftar" });
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: "USER",
      },
    });
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    setSessionCookie(ctx.resHeaders, token);
    return { ok: true };
  }),

  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    const valid = user && (await bcrypt.compare(input.password, user.passwordHash));
    if (!valid) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Email atau password salah" });
    }
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    setSessionCookie(ctx.resHeaders, token);
    return { ok: true };
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    ctx.resHeaders?.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    );
    return { ok: true };
  }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session) return null;
    return ctx.session;
  }),
});

export default authRouter;