import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ action: z.enum(["resolve", "dismiss"]) });

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { id } = await params;
  const status = parsed.data.action === "resolve" ? "resolved" : "dismissed";
  await query("UPDATE reports SET status = $2 WHERE id = $1", [id, status]);
  return NextResponse.json({ ok: true });
}
