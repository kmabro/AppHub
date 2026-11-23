import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const identifier = String(body?.identifier ?? "").trim();
  const password = String(body?.password ?? "");

  const { rows } = await query<{
    id: string;
    name: string;
    email: string;
    username: string | null;
    password_hash: string | null;
    is_admin: boolean;
  }>(
    "SELECT * FROM users WHERE is_admin = true AND (lower(email) = lower($1) OR lower(username) = lower($1))",
    [identifier]
  );
  const admin = rows[0];
  if (!admin || !admin.password_hash || !(await bcrypt.compare(password, admin.password_hash))) {
    return NextResponse.json({ error: "Incorrect administrator credentials" }, { status: 401 });
  }

  await createSession({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    username: admin.username ?? "",
    is_admin: true,
  });

  return NextResponse.json({ ok: true });
}
