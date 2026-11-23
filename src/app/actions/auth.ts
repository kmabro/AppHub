"use server";

import { query } from "@/lib/db";

export type AuthState = { error?: string; success?: string };

export async function createStudentProfile(id: string, name: string, email: string) {
  await query(
    `INSERT INTO users (id, name, email, password_hash, email_verified, username, bio, is_admin, is_blocked)
     VALUES ($1,$2,$3,'',false,$4,'',false,false)
     ON CONFLICT (id) DO NOTHING`,
    [id, name, email, email.split("@")[0].toLowerCase()]
  );
}
