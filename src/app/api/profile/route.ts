import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { httpUrl } from "@/lib/validation";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]{3,30}$/, "Use 3–30 letters, numbers, _ or -")
    .optional(),
  bio: z.string().trim().max(300).optional(),
  avatarUrl: httpUrl.nullable().optional(),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in first" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid profile" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  if (d.username) {
    const taken = await query(
      "SELECT id FROM users WHERE lower(username) = $1 AND id <> $2",
      [d.username, session.id]
    );
    if (taken.rowCount) {
      return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
    }
  }

  const fields: Array<[string, unknown]> = [
    ["name", d.name],
    ["username", d.username],
    ["bio", d.bio],
    ["avatar_url", d.avatarUrl],
  ].filter(([, value]) => value !== undefined) as Array<[string, unknown]>;

  if (fields.length) {
    const sets = fields.map(([column], index) => `${column} = $${index + 2}`);
    await query(`UPDATE users SET ${sets.join(", ")} WHERE id = $1`, [
      session.id,
      ...fields.map(([, value]) => value),
    ]);
  }

  return NextResponse.json({ ok: true });
}
