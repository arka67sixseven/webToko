import { createCallerFactory } from "@/server/trpc/trpc";
import { createContext } from "@/server/trpc/context";
import type { SessionUser } from "@/server/auth";
import { appRouter } from "@/server/trpc/router";
import { getSession } from "@/server/auth";

const createCaller = createCallerFactory(appRouter);

/**
 * Call tRPC directly from Server Components.
 * Pass `withSession` only when the page is dynamic and needs user context
 * (e.g. account/checkout). Public pages stay prereder-clean.
 */
export async function serverCaller(withSession = false) {
  const session: SessionUser | null = withSession ? await getSession() : null;
  const ctx = await createContext({ session });
  return createCaller(ctx);
}