import { createHash, randomBytes } from "node:crypto";
import { query } from "./db";

export type TokenType = "verify" | "reset";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAuthToken(userId: string, type: TokenType) {
  const token = randomBytes(32).toString("hex");
  const lifetime = type === "verify" ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;

  await query("DELETE FROM auth_tokens WHERE user_id = $1 AND type = $2", [userId, type]);
  await query(
    `INSERT INTO auth_tokens (user_id, type, token_hash, expires_at)
     VALUES ($1, $2, $3, now() + ($4 * interval '1 second'))`,
    [userId, type, hashToken(token), Math.floor(lifetime / 1000)]
  );

  return token;
}

export async function consumeAuthToken(token: string, type: TokenType) {
  const { rows } = await query<{ user_id: string }>(
    `DELETE FROM auth_tokens
     WHERE token_hash = $1 AND type = $2 AND expires_at > now()
     RETURNING user_id`,
    [hashToken(token), type]
  );
  return rows[0]?.user_id ?? null;
}
