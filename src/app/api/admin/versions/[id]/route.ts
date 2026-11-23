import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { deleteObject, keyFromUrl } from "@/lib/storage";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ action: z.enum(["approve", "reject"]) });

export async function POST(request: Request, { params }: Ctx) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { id } = await params;
  const { rows } = await query<{
    app_id: string;
    status: string;
    version: string;
    install_method: "file" | "link";
    platform: "android" | "ios";
    file_url: string | null;
    external_url: string | null;
    file_size: string | number;
  }>("SELECT * FROM app_versions WHERE id = $1", [id]);
  const version = rows[0];
  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });
  if (version.status !== "pending") {
    return NextResponse.json({ error: "This version has already been reviewed" }, { status: 400 });
  }

  if (parsed.data.action === "reject") {
    await query("UPDATE app_versions SET status = 'rejected' WHERE id = $1", [id]);
    const key = keyFromUrl(version.file_url);
    if (key) await deleteObject(key);
    return NextResponse.json({ ok: true });
  }

  await query("UPDATE app_versions SET is_current = false WHERE app_id = $1", [version.app_id]);
  await query("UPDATE app_versions SET status = 'published', is_current = true WHERE id = $1", [id]);
  await query(
    `UPDATE apps SET
      version = $2, install_method = $3, platform = $4,
      file_url = $5, external_url = $6, file_size = $7, updated_at = now()
     WHERE id = $1`,
    [
      version.app_id,
      version.version,
      version.install_method,
      version.platform,
      version.file_url,
      version.external_url,
      version.file_size,
    ]
  );

  return NextResponse.json({ ok: true });
}
