import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { httpUrl } from "@/lib/validation";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  packageName: z.string().trim().max(150).default(""),
  description: z.string().trim().max(2000).default(""),
  category: z.string().trim().max(60).default("Other"),
  platform: z.enum(["android", "ios"]),
  version: z.string().trim().max(30).default("1.0.0"),
  installMethod: z.enum(["file", "link"]),
  fileUrl: httpUrl.nullable().optional(),
  externalUrl: httpUrl.nullable().optional(),
  fileSize: z.number().int().nonnegative().default(0),
  iconUrl: httpUrl.nullable().optional(),
  screenshots: z.array(httpUrl).max(6).default([]),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in first" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid app details" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (data.installMethod === "file" && !data.fileUrl) {
    return NextResponse.json({ error: "Please upload the app file" }, { status: 400 });
  }
  if (data.installMethod === "link" && !data.externalUrl) {
    return NextResponse.json({ error: "Please provide an install link" }, { status: 400 });
  }

  const { rows } = await query<{ id: string }>(
    `INSERT INTO apps (
      owner_id, name, package_name, description, category, platform, version,
      install_method, file_url, external_url, file_size, icon_url, screenshots
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
    RETURNING id`,
    [
      session.id,
      data.name,
      data.packageName,
      data.description,
      data.category,
      data.platform,
      data.version,
      data.installMethod,
      data.fileUrl ?? null,
      data.externalUrl ?? null,
      data.fileSize,
      data.iconUrl ?? null,
      JSON.stringify(data.screenshots),
    ]
  );

  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
