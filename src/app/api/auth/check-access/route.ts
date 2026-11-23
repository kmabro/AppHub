import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ status: "missing" });

  const { rows: removed } = await query("SELECT email FROM deleted_emails WHERE email = $1", [email]);
  if (removed.length) return NextResponse.json({ status: "deleted" });

  const { rows } = await query<{ is_blocked: boolean; email_verified: boolean }>(
    "SELECT is_blocked, email_verified FROM users WHERE lower(email) = $1",
    [email]
  );
  if (!rows.length) return NextResponse.json({ status: "missing" });
  if (rows[0].is_blocked) return NextResponse.json({ status: "blocked" });
  if (!rows[0].email_verified) return NextResponse.json({ status: "unverified" });

  return NextResponse.json({ status: "active" });
}
