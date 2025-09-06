
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env" });

export default defineConfig({
  schema: "./src/drizzle/schema.ts",
  dialect: "postgresql",
  out: "./src/drizzle/migrations",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
   migrations: {
    table: 'migrations_v2'
  }
});
