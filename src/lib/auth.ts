import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, businesses } from "@/db/schema";

function getSecret() {
  const configured = process.env.AUTH_SECRET;
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set in production.");
    }
    // Development-only fallback. Never used by a production deployment.
    return new TextEncoder().encode("local-development-only-backbar-secret-32-bytes");
  }
  if (configured.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return new TextEncoder().encode(configured);
}

export const SESSION_COOKIE = "backbar_session";

export interface Session {
  userId: number;
  businessId: number;
}

export async function createSessionToken(userId: number, businessId: number) {
  return new SignJWT({ uid: userId, biz: businessId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function setSessionCookie(token: string) {
  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  try {
    const c = await cookies();
    const t = c.get(SESSION_COOKIE)?.value;
    if (!t) return null;
    const { payload } = await jwtVerify(t, getSecret());
    const userId = Number(payload.uid);
    const businessId = Number(payload.biz);
    if (!userId || !businessId) return null;
    return { userId, businessId };
  } catch {
    return null;
  }
}

/** Server-side guard: returns user + business or redirects to /login. */
export async function requireBiz() {
  const session = await getSession();
  if (!session) redirect("/login");
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, session.businessId))
    .limit(1);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!business || !user) redirect("/login");
  return { user, business, session };
}
