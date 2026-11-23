import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import type { Review } from "@/lib/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(1000).default(""),
});

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const { rows } = await query<Review>(
    `SELECT r.*, u.name AS author_name, u.username AS author_username, u.avatar_url AS author_avatar
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.app_id = $1
     ORDER BY r.updated_at DESC`,
    [id]
  );
  const stats = await query<{ avg: string | null; count: string }>(
    "SELECT round(avg(rating)::numeric, 1) AS avg, count(*) AS count FROM reviews WHERE app_id = $1",
    [id]
  );
  return NextResponse.json({
    reviews: rows,
    average: stats.rows[0]?.avg ? Number(stats.rows[0].avg) : 0,
    count: Number(stats.rows[0]?.count ?? 0),
  });
}

export async function POST(request: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in first" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid review" }, { status: 400 });

  const { id } = await params;
  const { rows } = await query<Review>(
    `INSERT INTO reviews (app_id, user_id, rating, body)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (app_id, user_id)
     DO UPDATE SET rating = EXCLUDED.rating, body = EXCLUDED.body, updated_at = now()
     RETURNING *`,
    [id, session.id, parsed.data.rating, parsed.data.body]
  );

  return NextResponse.json({ review: rows[0] });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in first" }, { status: 401 });

  const { id } = await params;
  await query("DELETE FROM reviews WHERE app_id = $1 AND user_id = $2", [id, session.id]);
  return NextResponse.json({ ok: true });
}
