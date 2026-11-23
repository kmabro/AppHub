import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const { rows } = await query<{ id: string; email: string }>(
    "SELECT id, email FROM users WHERE email = $1",
    [parsed.data.email]
  );

  let emailSent = false;
  if (rows[0]) {
    const token = await createAuthToken(rows[0].id, "reset");
    emailSent = await sendPasswordResetEmail(rows[0].email, token);
  }

  return NextResponse.json({ ok: true, emailSent });
}
