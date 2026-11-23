import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { query } from "./db";

const COOKIE_NAME = "apphub_session";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not configured");
  return new TextEncoder().encode(value);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  username?: string;
  email_verified?: boolean;
  avatarUrl?: string | null;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    name: user.name,
    email: user.email,
    is_admin: user.is_admin,
    username: user.username ?? "",
    avatarUrl: user.avatarUrl ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
  });
}

async function getCustomSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      is_admin: Boolean(payload.is_admin),
      username: String(payload.username ?? ""),
      avatarUrl: (payload.avatarUrl as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const adminSession = await getCustomSession();
  if (adminSession) return adminSession;

  const store = await cookies();
  const dataCookie =
    store.get("__Secure-neon-auth.local.session_data")?.value ??
    store.get("neon-auth.local.session_data")?.value;
  if (!dataCookie) return null;

  try {
    const secretValue = process.env.NEON_AUTH_COOKIE_SECRET;
    if (!secretValue) return null;
    const { payload } = await jwtVerify(dataCookie, new TextEncoder().encode(secretValue), {
      algorithms: ["HS256"],
    });
    const user = payload.user as
      | { id?: string; name?: string; email?: string; emailVerified?: boolean }
      | undefined;
    const session = payload.session as { expiresAt?: string } | undefined;
    if (!user?.id) return null;
    if (session?.expiresAt && Date.parse(session.expiresAt) < Date.now()) return null;

    const { rows } = await query<{
      is_admin: boolean;
      is_blocked: boolean;
      username: string | null;
      avatar_url: string | null;
    }>("SELECT is_admin, is_blocked, username, avatar_url FROM users WHERE id = $1", [user.id]);
    if (!rows[0] || rows[0].is_blocked) return null;

    return {
      id: user.id,
      name: user.name ?? "",
      email: user.email ?? "",
      is_admin: Boolean(rows[0].is_admin),
      username: rows[0].username ?? "",
      email_verified: Boolean(user.emailVerified),
      avatarUrl: rows[0].avatar_url,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.is_admin ? session : null;
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
