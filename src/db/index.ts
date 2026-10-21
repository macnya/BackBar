import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  throw new Error("DATABASE_URL is required");
}
const databaseUrl: string = rawUrl;

function parseHostname(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

const host = parseHostname(databaseUrl) ?? "";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "::ffff:127.0.0.1"]);
const isLocal = LOCAL_HOSTS.has(host) || host.endsWith(".local");

// node-postgres does not honour `sslmode=...` from the connection string, so we
// derive the SSL option ourselves. Supabase requires TLS on the shared pooler,
// and any non-local host in production gets SSL enabled. Use
// `?sslmode=no-verify` or set DB_SSL_LENIENT=1 if your provider's cert can't be
// validated strictly.
function buildSslConfig(): false | { rejectUnauthorized: boolean } {
  if (/sslmode=(disable|allow|prefer)/i.test(databaseUrl)) return false;

  const forceSsl = /sslmode=(require|verify-ca|verify-full)/i.test(databaseUrl);
  const isProd = process.env.NODE_ENV === "production";
  const isSupabaseHost =
    /(^|\.)supabase\.co$/i.test(host) || /pooler\.supabase/i.test(host);
  // Supabase's pooler presents a certificate chain that Node does not trust by
  // default ("self-signed certificate in certificate chain"). The connection is
  // still encrypted; we just skip chain verification for Supabase hosts.
  const lenient =
    isSupabaseHost ||
    /sslmode=no-verify/i.test(databaseUrl) ||
    process.env.DB_SSL_LENIENT === "1";
  if (isLocal && !forceSsl && !isSupabaseHost) return false;
  if (forceSsl || (!isLocal && isProd) || isSupabaseHost) {
    return { rejectUnauthorized: !lenient };
  }
  return false;
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

// pg-connection-string (used by pg) treats `sslmode=require` in the URL as
// "verify-full" and lets it OVERRIDE the `ssl` option below, which causes
// "self-signed certificate in certificate chain" on Supabase. Remove SSL
// params from the URL so the `ssl` option built above is the one that applies.
const connectionString = databaseUrl
  .replace(/([?&])(sslmode|sslcert|sslkey|sslrootcert|uselibpqcompat)=[^&]*&?/gi, "$1")
  .replace(/[?&]$/, "");

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    ssl: buildSslConfig(),
  });

globalForDb.__arenaNextJsPostgresqlPool = pool;

pool.on("error", (err) => {
  console.error("pg pool error:", err);
});

export const db = drizzle(pool);