import { Pool, type QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as { apphubPool?: Pool };

export const pool =
  globalForDb.apphubPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.VERCEL ? 1 : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.apphubPool = pool;

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  return pool.query<T>(text, params);
}
