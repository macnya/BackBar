import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, businesses } from "@/db/schema";
import {
  clearSessionCookie,
  createSessionToken,
  getSession,
  setSessionCookie,
} from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });

  if (body.action === "logout") {
    await clearSessionCookie();
    return Response.json({ ok: true });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }
  if (body.action === "register") {
    const name = String(body.name ?? "").trim();
    const businessName = String(body.businessName ?? "").trim();
    if (name.length < 2) return Response.json({ ok: false, error: "Please enter your name." }, { status: 400 });
    if (businessName.length < 2)
      return Response.json({ ok: false, error: "Please enter your restaurant or bar name." }, { status: 400 });
    if (password.length < 6)
      return Response.json({ ok: false, error: "Password must be at least 6 characters." }, { status: 400 });

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing)
      return Response.json({ ok: false, error: "An account with this email already exists. Try signing in." }, { status: 409 });

    const hash = bcrypt.hashSync(password, 10);
    const [user] = await db.insert(users).values({ name, email, passwordHash: hash }).returning();
    const [business] = await db
      .insert(businesses)
      .values({
        ownerId: user.id,
        name: businessName,
        type: body.businessType === "bar" || body.businessType === "bistro" ? body.businessType : "restaurant",
        address: String(body.address ?? "").trim(),
        phone: String(body.phone ?? "").trim(),
      })
      .returning();

    const token = await createSessionToken(user.id, business.id);
    await setSessionCookie(token);
    return Response.json({ ok: true });
  }

  if (body.action === "login") {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return Response.json({ ok: false, error: "Incorrect email or password." }, { status: 401 });
    }
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.ownerId, user.id))
      .limit(1);
    if (!business) return Response.json({ ok: false, error: "No business found for this account." }, { status: 404 });
    const token = await createSessionToken(user.id, business.id);
    await setSessionCookie(token);
    return Response.json({ ok: true });
  }

  return Response.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

export async function GET() {
  const session = await getSession();
  return Response.json({ ok: true, authed: !!session });
}
