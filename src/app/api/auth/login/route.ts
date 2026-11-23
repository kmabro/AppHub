import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "@/lib/db";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const { rows } = await query<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
    is_admin: boolean;
  }>("SELECT * FROM users WHERE email = $1", [email]);

  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  await createSession(user);
  return NextResponse.json({ ok: true });
}
