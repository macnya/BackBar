import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { seedDemo } from "@/lib/demo-seed";

export async function POST() {
  try {
    const { user, business } = await seedDemo();
    const token = await createSessionToken(user.id, business.id);
    await setSessionCookie(token);
    return Response.json({ ok: true, business: business.name });
  } catch (e) {
    console.error("demo seed failed", e);
    return Response.json({ ok: false, error: "Could not load the demo. Please try again." }, { status: 500 });
  }
}
