import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const { rows } = await query<{
    file_url: string | null;
    external_url: string | null;
  }>("SELECT file_url, external_url FROM apps WHERE id = $1", [id]);

  const app = rows[0];
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });

  const target = app.file_url || app.external_url;
  if (!target) return NextResponse.json({ error: "No install file available" }, { status: 404 });

  await query("UPDATE apps SET downloads = downloads + 1 WHERE id = $1", [id]);
  return NextResponse.redirect(target, 302);
}
