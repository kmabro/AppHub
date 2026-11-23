import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  const cookiesToClear = [
    "apphub_session",
    "__Secure-neon-auth.session_token",
    "__Secure-neon-auth.local.session_data",
    "__Secure-neon-auth.session_challenge",
    "neon-auth.session_token",
    "neon-auth.local.session_data",
    "neon-auth.session_challenge",
  ];

  for (const name of cookiesToClear) {
    response.cookies.delete(name);
  }

  return response;
}
