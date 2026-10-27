import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/crmforu";

// Global singleton to prevent multiple connection pools during hot-reloads
const globalForDb = globalThis as unknown as {
  pgClient?: postgres.Sql;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

export function getPostgresClient() {
  if (!globalForDb.pgClient) {
    const isSupabase =
      connectionString.includes("supabase.co") ||
      connectionString.includes("pooler.supabase.com");

    globalForDb.pgClient = postgres(connectionString, {
      max: process.env.NODE_ENV === "production" ? 1 : 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: isSupabase ? "require" : undefined,
      prepare: false, // Recommended for Supabase transaction pooler (port 6543)
    });
  }
  return globalForDb.pgClient;
}

export const db = globalForDb.db ?? drizzle(getPostgresClient(), { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

/**
 * Check if PostgreSQL connection is healthy
 */
export async function testDbConnection(): Promise<{ ok: boolean; message?: string }> {
  try {
    const client = getPostgresClient();
    await client`SELECT 1`;
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg };
  }
}
