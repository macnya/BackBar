import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Load .env / .env.local for local Drizzle CLI commands.
loadEnvConfig(process.cwd());

const url = process.env.DRIZZLE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("Set DRIZZLE_DATABASE_URL (preferred) or DATABASE_URL before running Drizzle Kit.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url },
});