import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "tk_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

const jwtSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === "production" && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error(
    "JWT_SECRET wajib di-set dan minimal 32 karakter di production. Generate dengan: openssl rand -base64 48",
  );
}

const secret = () => new TextEncoder().encode(jwtSecret ?? "dev-insecure-secret");

function isSessionUser(payload: JWTPayload): payload is SessionUser & JWTPayload {
  return (
    typeof payload.sub === "string" &&
    typeof payload.email === "string" &&
    typeof payload.name === "string" &&
    (payload.role === "USER" || payload.role === "ADMIN")
  );
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!isSessionUser(payload)) return null;
    return {
      id: payload.sub!,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

/** Read current session purely from the request cookie (for RSC / action context). */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Fetch the full user row for the current session. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || user.email !== session.email) return null;
  return user;
}

export function requireSession(session: SessionUser | null, message = "Harus login"): asserts session is SessionUser {
  if (!session) {
    const error = new Error(message) as Error & { code?: string };
    error.code = "UNAUTHORIZED";
    throw error;
  }
}

export function assertAdmin(session: SessionUser | null): asserts session is SessionUser & { role: "ADMIN" } {
  requireSession(session, "Harus login");
  if (session.role !== "ADMIN") {
    const error = new Error("Akses ditolak") as Error & { code?: string };
    error.code = "FORBIDDEN";
    throw error;
  }
}