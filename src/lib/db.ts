import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "../app/drizzle/schema";
import { DATABASE_URL } from "./secrets";

/**
 * @fileOverview Inisialisasi koneksi Drizzle ORM dengan Neon DB.
 * Menggunakan Pool dari @neondatabase/serverless agar mendukung transaksi (db.transaction).
 */

const pool = new Pool({ connectionString: DATABASE_URL || "" });
export const db = drizzle(pool, { schema });
