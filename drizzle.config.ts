import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load env variables for Drizzle Kit CLI
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

export default defineConfig({
  schema: "./src/app/drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  migrations: {
    table: "migrations",
    schema: "public"
  }
});
