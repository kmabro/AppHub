import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { deleteObject, keyFromUrl } from "@/lib/storage";
import { httpUrl } from "@/lib/validation";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  packageName: z.string().trim().max(150).optional(),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(60).optional(),
  platform: z.enum(["android", "ios"]).optional(),
  version: z.string().trim().min(1).max(30).optional(),
  installMethod: z.enum(["file", "link"]).optional(),
  fileUrl: httpUrl.nullable().optional(),
  externalUrl: httpUrl.nullable().optional(),
  fileSize: z.number().int().nonnegative().optional(),
  iconUrl: httpUrl.nullable().optional(),
  screenshots: z.array(httpUrl).max(6).optional(),
});

async function getApp(id: string) {
  const { rows } = await query<{
    id: string;
    owner_id: string;
    file_url: string | null;
    icon_url: string | null;
    screenshots: string[] | null;
  }>("SELECT id, owner_id, file_url, icon_url, screenshots FROM apps WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in first" }, { status: 401 });

  const { id } = await params;
  const app = await getApp(id);
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });
  if (app.owner_id !== session.id && !session.is_admin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid app details" }, { status: 400 });
  }
  const d = parsed.data;

  const fields: Array<[string, string, unknown]> = [
    ["name", "name", d.name],
    ["package_name", "packageName", d.packageName],
    ["description", "description", d.description],
    ["category", "category", d.category],
    ["platform", "platform", d.platform],
    ["version", "version", d.version],
    ["install_method", "installMethod", d.installMethod],
    ["file_url", "fileUrl", d.fileUrl],
    ["external_url", "externalUrl", d.externalUrl],
    ["file_size", "fileSize", d.fileSize],
    ["icon_url", "iconUrl", d.iconUrl],
    [
      "screenshots",
      "screenshots",
      d.screenshots === undefined ? undefined : JSON.stringify(d.screenshots),
    ],
  ];

  const provided = fields.filter(([, , value]) => value !== undefined);
  const sets = provided.map(([column], index) =>
    column === "screenshots" ? `${column} = $${index + 2}::jsonb` : `${column} = $${index + 2}`
  );

  if (sets.length) {
    await query(
      `UPDATE apps SET ${sets.join(", ")}, updated_at = now() WHERE id = $1`,
      [id, ...provided.map(([, , value]) => value)]
    );
  }

  const oldKeys: string[] = [];
  if (d.iconUrl !== undefined && d.iconUrl !== app.icon_url) {
    oldKeys.push(keyFromUrl(app.icon_url));
  }
  if (d.fileUrl !== undefined && d.fileUrl !== app.file_url) {
    oldKeys.push(keyFromUrl(app.file_url));
  }
  if (d.screenshots !== undefined) {
    for (const url of app.screenshots ?? []) {
      if (!d.screenshots.includes(url)) oldKeys.push(keyFromUrl(url));
    }
  }
  await Promise.allSettled(oldKeys.filter(Boolean).map((key) => deleteObject(key)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in first" }, { status: 401 });

  const { id } = await params;
  const app = await getApp(id);
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });
  if (app.owner_id !== session.id && !session.is_admin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const keys = [
    keyFromUrl(app.file_url),
    keyFromUrl(app.icon_url),
    ...(app.screenshots ?? []).map((url) => keyFromUrl(url)),
  ].filter(Boolean);

  await query("DELETE FROM apps WHERE id = $1", [id]);
  await Promise.allSettled(keys.map((key) => deleteObject(key)));

  return NextResponse.json({ ok: true });
}
