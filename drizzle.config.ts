import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./src/lib/secrets";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in src/lib/secrets.ts");
}

export default defineConfig({
  schema: "./src/app/drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
  migrations: {
    table: "migrations",
    schema: "public"
  }
});
