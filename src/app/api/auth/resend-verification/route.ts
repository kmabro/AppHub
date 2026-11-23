import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const { rows } = await query<{ id: string; email: string; email_verified: boolean }>(
    "SELECT id, email, email_verified FROM users WHERE email = $1",
    [parsed.data.email]
  );

  let emailSent = false;
  let verificationToken: string | null = null;
  if (rows[0] && !rows[0].email_verified) {
    verificationToken = await createAuthToken(rows[0].id, "verify");
    emailSent = await sendVerificationEmail(rows[0].email, verificationToken);
  }

  return NextResponse.json({
    ok: true,
    emailSent,
    verificationToken: emailSent ? null : verificationToken,
  });
}
