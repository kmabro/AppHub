import { NextResponse } from "next/server";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const userId = token ? await consumeAuthToken(token, "verify") : null;

  if (!userId) {
    return NextResponse.redirect(new URL("/login?verify=invalid", request.url));
  }

  await query("UPDATE users SET email_verified = true WHERE id = $1", [userId]);
  await query("DELETE FROM auth_tokens WHERE user_id = $1 AND type = 'verify'", [userId]);
  return NextResponse.redirect(new URL("/login?verified=1", request.url));
}
