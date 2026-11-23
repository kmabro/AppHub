import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "@/lib/db";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().min(1).max(120),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email or username and password" }, { status: 400 });
  }

  const identifier = parsed.data.email;
  const byEmail = identifier.includes("@");
  const { rows } = await query<{
    id: string;
    name: string;
    email: string;
    username: string;
    password_hash: string;
    is_admin: boolean;
    email_verified: boolean;
    is_blocked: boolean;
  }>(
    byEmail
      ? "SELECT * FROM users WHERE email = $1"
      : "SELECT * FROM users WHERE lower(username) = lower($1)",
    [identifier]
  );

  const user = rows[0];
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }
  if (user.is_blocked) {
    return NextResponse.json({ error: "This account has been blocked by an administrator" }, { status: 403 });
  }
  if (!user.email_verified) {
    return NextResponse.json(
      { error: "Please verify your email before signing in. Check your inbox." },
      { status: 403 }
    );
  }

  await createSession(user);
  return NextResponse.json({ ok: true });
}
