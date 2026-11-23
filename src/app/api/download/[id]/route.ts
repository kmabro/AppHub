import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
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

export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;
  const versionId = new URL(request.url).searchParams.get("version");

  if (versionId) {
    const { rows } = await query<{
      app_name: string;
      owner_id: string;
      version: string;
      platform: "android" | "ios";
      install_method: "file" | "link";
      file_url: string | null;
      external_url: string | null;
      status: "published" | "pending" | "rejected";
    }>(
      `SELECT a.name AS app_name, a.owner_id, v.version, v.platform, v.install_method,
              v.file_url, v.external_url, v.status
       FROM app_versions v JOIN apps a ON a.id = v.app_id
       WHERE v.id = $1 AND v.app_id = $2`,
      [versionId, id]
    );
    const version = rows[0];
    if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

    if (version.status !== "published") {
      const session = await getSession();
      if (!session || (session.id !== version.owner_id && !session.is_admin)) {
        return NextResponse.json({ error: "This version is not published yet" }, { status: 403 });
      }
    }

    let target: string;
    if (version.install_method === "file" && version.file_url) {
      const key = keyFromUrl(version.file_url);
      if (!key) return NextResponse.json({ error: "File not found" }, { status: 404 });
      const extension = version.platform === "ios" ? "ipa" : "apk";
      target = await createDownloadUrl(
        key,
        safeFileName(`${version.app_name}-${version.version}`, extension)
      );
    } else if (version.external_url) {
      target = version.external_url;
    } else {
      return NextResponse.json({ error: "No install file available" }, { status: 404 });
    }

    await query("UPDATE apps SET downloads = downloads + 1 WHERE id = $1", [id]);
    return NextResponse.redirect(target, 302);
  }

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
