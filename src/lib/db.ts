import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../app/drizzle/schema";
import { DATABASE_URL } from "./secrets";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Please check your .env file.");
}

// Menggunakan neon-http untuk koneksi yang efisien di lingkungan serverless/edge
const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });
