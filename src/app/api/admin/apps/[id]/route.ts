import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { deleteObject, keyFromUrl } from "@/lib/storage";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  action: z.enum(["suspend", "restore", "feature", "unfeature", "delete"]),
});

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { id } = await params;
  const { action } = parsed.data;

  if (action === "delete") {
    const { rows: versions } = await query<{ file_url: string | null }>(
      "SELECT file_url FROM app_versions WHERE app_id = $1",
      [id]
    );
    const { rows: apps } = await query<{
      file_url: string | null;
      icon_url: string | null;
      screenshots: string[] | null;
    }>("SELECT file_url, icon_url, screenshots FROM apps WHERE id = $1", [id]);
    const app = apps[0];
    if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });

    const keys = [
      ...versions.map((version) => keyFromUrl(version.file_url)),
      keyFromUrl(app.file_url),
      keyFromUrl(app.icon_url),
      ...(app.screenshots ?? []).map((url) => keyFromUrl(url)),
    ].filter(Boolean);

    await query("DELETE FROM apps WHERE id = $1", [id]);
    await Promise.allSettled(keys.map((key) => deleteObject(key)));
    return NextResponse.json({ ok: true });
  }

  const column = action === "feature" || action === "unfeature" ? "featured" : "status";
  const value =
    action === "suspend"
      ? "suspended"
      : action === "restore"
        ? "published"
        : action === "feature";
  await query(`UPDATE apps SET ${column} = $2 WHERE id = $1`, [id, value]);

  return NextResponse.json({ ok: true });
}
