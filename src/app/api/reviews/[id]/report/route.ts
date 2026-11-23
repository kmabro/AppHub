import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ reason: z.string().trim().min(3).max(500) });

export async function POST(request: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in first" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please give a short reason" }, { status: 400 });

  const { id } = await params;
  const { rows } = await query<{ app_id: string }>("SELECT app_id FROM reviews WHERE id = $1", [id]);
  if (!rows[0]) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  await query(
    "INSERT INTO reports (reporter_id, app_id, review_id, reason) VALUES ($1,$2,$3,$4)",
    [session.id, rows[0].app_id, id, parsed.data.reason]
  );

  return NextResponse.json({ ok: true });
}
