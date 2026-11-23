import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createUploadUrl, publicUrl } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_SIZE: Record<string, number> = {
  apk: 200 * 1024 * 1024,
  ipa: 200 * 1024 * 1024,
  icon: 5 * 1024 * 1024,
  screenshot: 5 * 1024 * 1024,
};

const CONTENT_TYPE: Record<string, string> = {
  apk: "application/vnd.android.package-archive",
  ipa: "application/octet-stream",
  icon: "image/png",
  screenshot: "image/png",
};

const schema = z.object({
  kind: z.enum(["apk", "ipa", "icon", "screenshot"]),
  fileName: z.string().min(1).max(200),
  size: z.number().int().positive(),
  contentType: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in first" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid file request" }, { status: 400 });
  }

  const { kind, fileName, size, contentType: requestedType } = parsed.data;
  const max = MAX_SIZE[kind];
  if (size > max) {
    return NextResponse.json(
      { error: `File too large. Maximum is ${Math.round(max / 1024 / 1024)} MB` },
      { status: 413 }
    );
  }

  const safeName = fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .slice(-80);
  const key = `${kind}s/${session.id}/${randomUUID()}-${safeName}`;
  const isImage = kind === "icon" || kind === "screenshot";
  const contentType =
    isImage && requestedType?.startsWith("image/") ? requestedType : CONTENT_TYPE[kind];
  const uploadUrl = await createUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, url: publicUrl(key), key, contentType });
}
