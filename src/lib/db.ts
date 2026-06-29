import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../app/drizzle/schema";
import { DATABASE_URL } from "./secrets";

// Menggunakan neon-http untuk koneksi yang efisien di lingkungan serverless/edge Neon
// Kita tidak melempar error di sini agar proses build Next.js tidak terhenti.
// Error akan ditangani secara runtime jika koneksi gagal.
const sql = neon(DATABASE_URL || "");
export const db = drizzle(sql, { schema });
