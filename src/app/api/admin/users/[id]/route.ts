import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { deleteObject, keyFromUrl } from "@/lib/storage";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ action: z.enum(["block", "unblock", "verify", "delete"]) });

export async function PATCH(request: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { id } = await params;
  const { action } = parsed.data;

  const { rows: targets } = await query<{ is_admin: boolean }>(
    "SELECT is_admin FROM users WHERE id = $1",
    [id]
  );
  if (!targets[0]) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (targets[0].is_admin && (action === "block" || action === "delete")) {
    return NextResponse.json({ error: "Admin accounts cannot be blocked or deleted" }, { status: 403 });
  }

  if (action === "delete" && id === admin.id) {
    return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
  }

  if (action === "block" || action === "unblock") {
    await query("UPDATE users SET is_blocked = $2 WHERE id = $1", [id, action === "block"]);
    return NextResponse.json({ ok: true });
  }

  if (action === "verify") {
    await query("UPDATE users SET email_verified = true WHERE id = $1", [id]);
    await query("DELETE FROM auth_tokens WHERE user_id = $1 AND type = 'verify'", [id]);
    return NextResponse.json({ ok: true });
  }

  const { rows: apps } = await query<{ id: string; file_url: string | null; icon_url: string | null; screenshots: string[] | null }>(
    "SELECT id, file_url, icon_url, screenshots FROM apps WHERE owner_id = $1",
    [id]
  );
  const keys: string[] = [];
  for (const app of apps) {
    const { rows: versions } = await query<{ file_url: string | null }>(
      "SELECT file_url FROM app_versions WHERE app_id = $1",
      [app.id]
    );
    keys.push(...versions.map((version) => keyFromUrl(version.file_url)));
    keys.push(keyFromUrl(app.file_url), keyFromUrl(app.icon_url));
    keys.push(...(app.screenshots ?? []).map((url) => keyFromUrl(url)));
  }

  const { rows: deletedTarget } = await query<{ email: string }>(
    "SELECT email FROM users WHERE id = $1",
    [id]
  );
  const email = deletedTarget[0]?.email?.toLowerCase();

  await query("DELETE FROM users WHERE id = $1", [id]);
  if (email) {
    await query(
      "INSERT INTO deleted_emails (email) VALUES ($1) ON CONFLICT DO NOTHING",
      [email]
    );
    try {
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      await fetch(`${process.env.NEON_AUTH_BASE_URL}/admin/remove-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({ id }),
      });
    } catch {
      // The email is blocked in deleted_emails even if the auth directory call fails.
    }
  }
  await Promise.allSettled(keys.filter(Boolean).map((key) => deleteObject(key)));
  return NextResponse.json({ ok: true });
}
