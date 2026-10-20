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

function errorResponse(msg: string, status = 400) {
  return Response.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid request body.");
  }
  if (!body) return errorResponse("Invalid request");

  try {
    if (body.action === "logout") {
      await clearSessionCookie();
      return Response.json({ ok: true });
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!EMAIL_RE.test(email)) {
      return errorResponse("Please enter a valid email address.");
    }

    if (body.action === "register") {
      const name = String(body.name ?? "").trim();
      const businessName = String(body.businessName ?? "").trim();
      if (name.length < 2) return errorResponse("Please enter your name.");
      if (businessName.length < 2)
        return errorResponse("Please enter your restaurant or bar name.");
      if (password.length < 6)
        return errorResponse("Password must be at least 6 characters.");

      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existing)
        return errorResponse("An account with this email already exists. Try signing in.", 409);

      const hash = bcrypt.hashSync(password, 10);
      const [user] = await db
        .insert(users)
        .values({ name, email, passwordHash: hash })
        .returning();
      const [business] = await db
        .insert(businesses)
        .values({
          ownerId: user.id,
          name: businessName,
          type:
            body.businessType === "bar" || body.businessType === "bistro"
              ? body.businessType
              : "restaurant",
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
        return errorResponse("Incorrect email or password.", 401);
      }
      const [business] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.ownerId, user.id))
        .limit(1);
      if (!business) return errorResponse("No business found for this account.", 404);
      const token = await createSessionToken(user.id, business.id);
      await setSessionCookie(token);
      return Response.json({ ok: true });
    }

    return errorResponse("Unknown action");
  } catch (err) {
    console.error("auth route error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong while signing you up.";
    if (
      /(connection|connect|database|ssl|password authentication|ENOTFOUND|ECONN|ETIMEDOUT|no pg_hba|too many connections)/i.test(
        message
      )
    ) {
      return errorResponse(
        `Could not reach the database: ${message}. Check that DATABASE_URL points to Supabase Session pooler (port 5432) and SSL is enabled.`,
        500
      );
    }
    return errorResponse(message, 500);
  }
}

export async function GET() {
  try {
    const session = await getSession();
    return Response.json({ ok: true, authed: !!session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Session check failed";
    return errorResponse(message, 500);
  }
}