import { verifySessionToken, type SessionUser } from "@/server/auth";
import type { Context } from "./trpc";

type CreateContextOptions = {
  req?: Request;
  resHeaders?: Headers;
  session?: SessionUser | null;
};

function getIp(req?: Request): string | null {
  if (!req) return null;
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local"
  );
}

async function readSession(req?: Request, session?: SessionUser | null) {
  if (session !== undefined) return session;
  if (req) {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/(?:^|;\s*)tk_session=([^;]+)/);
    const token = match?.[1] ? decodeURIComponent(match[1]) : null;
    return token ? verifySessionToken(token) : null;
  }
  return null;
}

export function createContext(opts: CreateContextOptions): Promise<Context> {
  const req = "req" in opts ? opts.req : undefined;
  const resHeaders = "resHeaders" in opts ? opts.resHeaders : undefined;
  const session = "session" in opts ? opts.session : undefined;
  return readSession(req, session).then((s) => ({
    session: s,
    ip: getIp(req),
    resHeaders: resHeaders ?? null,
  }));
}

export type RouterContext = Context;