import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);

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
    // __Secure- prefixed cookies can only be deleted with a Secure attribute.
    response.cookies.set({
      name,
      value: "",
      path: "/",
      expires: new Date(0),
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  response.headers.set("Cache-Control", "no-store");
  return response;
}
