import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't auto-load .env.local (the file Vercel writes).
// Node 22's process.loadEnvFile keeps this dep-free.
try {
  process.loadEnvFile(".env.local");
} catch {
  // fall back to shell env
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
