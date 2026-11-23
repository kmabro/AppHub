import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createDownloadUrl, keyFromUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function safeFileName(name: string, extension: string) {
  const cleaned = name
    .replace(/[\r\n"\\/]/g, "")
    .replace(/[^\w\s-]/g, "_")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return `${cleaned || "app"}.${extension}`;
}

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const { rows } = await query<{
    name: string;
    platform: "android" | "ios";
    install_method: "file" | "link";
    file_url: string | null;
    external_url: string | null;
  }>(
    "SELECT name, platform, install_method, file_url, external_url FROM apps WHERE id = $1",
    [id]
  );

  const app = rows[0];
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });

  let target: string;
  if (app.install_method === "file" && app.file_url) {
    const key = keyFromUrl(app.file_url);
    if (!key) return NextResponse.json({ error: "File not found" }, { status: 404 });
    const extension = app.platform === "ios" ? "ipa" : "apk";
    target = await createDownloadUrl(key, safeFileName(app.name, extension));
  } else if (app.external_url) {
    target = app.external_url;
  } else {
    return NextResponse.json({ error: "No install file available" }, { status: 404 });
  }

  await query("UPDATE apps SET downloads = downloads + 1 WHERE id = $1", [id]);
  return NextResponse.redirect(target, 302);
}
