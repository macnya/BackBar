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

/**
 * Drizzle wraps driver errors in a "Failed query: ..." error and puts the real
 * Postgres error in `.cause`. Walk down to the real one so we can show a
 * useful message instead of the SQL text.
 */
function rootError(err: unknown): { message: string; code?: string } {
  let e: any = err;
  for (let i = 0; i < 5 && e?.cause && e.cause !== e; i++) e = e.cause;
  return {
    message: String(e?.message ?? err ?? "Unknown error"),
    code: e?.code ? String(e.code) : undefined,
  };
}

function handleError(err: unknown) {
  console.error("auth route error:", err);
  const { message, code } = rootError(err);

  // Table missing -> schema was never pushed to this database
  if (code === "42P01" || /relation ".*" does not exist/i.test(message)) {
    return errorResponse(
      "The database tables have not been created yet. Run the setup SQL in the Supabase SQL Editor (or `npx drizzle-kit push`), then try again.",
      500
    );
  }
  // Unique violation (e.g. two sign-ups with the same email at once)
  if (code === "23505") {
    return errorResponse("An account with this email already exists. Try signing in.", 409);
  }
  // Wrong DB password
  if (code === "28P01" || /password authentication failed/i.test(message)) {
    return errorResponse(
      "Database login failed. Check the password in DATABASE_URL (it must be your Supabase database password).",
      500
    );
  }
  // Supabase pooler: wrong username / project ref
  if (/tenant or user not found/i.test(message)) {
    return errorResponse(
      "Database user not recognised. In DATABASE_URL the username must look like postgres.<project-ref> exactly as shown in Supabase > Connect.",
      500
    );
  }
  // Bad session secret
  if (/AUTH_SECRET/i.test(message)) {
    return errorResponse(`Server configuration problem: ${message}`, 500);
  }
  // Can't reach DB
  if (
    /(ENOTFOUND|ECONN|ETIMEDOUT|EAI_AGAIN|timeout|ssl|self.signed|certificate|no pg_hba|too many connections|terminating connection)/i.test(
      message
    )
  ) {
    return errorResponse(
      `Could not reach the database (${message}). Check DATABASE_URL (Supabase pooler, port 6543 on Vercel / 5432 locally) and that the Supabase project is not paused.`,
      500
    );
  }

  const detail = process.env.NODE_ENV === "production" ? "" : ` (${message})`;
  return errorResponse(`Could not complete the request. Please try again.${detail}`, 500);
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

      // Create the user AND their business together. If either insert fails,
      // both are rolled back, so you never end up with a half-created account
      // that then says "email already exists".
      const { user, business } = await db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({ name, email, passwordHash: hash })
          .returning();
        const [business] = await tx
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
        return { user, business };
      });

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
    return handleError(err);
  }
}

export async function GET() {
  try {
    const session = await getSession();
    return Response.json({ ok: true, authed: !!session });
  } catch (err) {
    return handleError(err);
  }
}