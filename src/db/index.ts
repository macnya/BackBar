
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error("DATABASE_URL is required");
}

function parseDatabaseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL URL");
  }
}

const parsedUrl = parseDatabaseUrl(rawUrl);
const host = parsedUrl.hostname.toLowerCase();

const isLocal =
  ["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(host) ||
  host.endsWith(".local");

const isSupabase =
  host.endsWith(".supabase.co") ||
  host.includes(".pooler.supabase.com") ||
  host.endsWith(".pooler.supabase.com");

// Remove pg-connection-string SSL parameters before passing the URL to pg.
// Otherwise, URL parameters may override the explicit SSL configuration.
const connectionUrl = new URL(rawUrl);

for (const key of [
  "sslmode",
  "sslcert",
  "sslkey",
  "sslrootcert",
  "uselibpqcompat",
]) {
  connectionUrl.searchParams.delete(key);
}

const connectionString = connectionUrl.toString();

const ssl =
  isLocal && !isSupabase
    ? false
    : {
        // Supabase pooler certificates may not validate against the
        // runtime's CA store. This encrypts the connection but does
        // not authenticate the server certificate.
        rejectUnauthorized: !isSupabase,
      };

const globalForDb = globalThis as typeof globalThis & {
  __backBarPostgresPool?: Pool;
};

export const pool =
  globalForDb.__backBarPostgresPool ??
  new Pool({
    connectionString,
    ssl,
    max: 1,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  });

globalForDb.__backBarPostgresPool = pool;

pool.on("error", (error) => {
  console.error("BackBar PostgreSQL pool error:", {
    name: error.name,
    code: (error as Error & { code?: string }).code,
    message: error.message,
  });
});

export const db = drizzle(pool);
