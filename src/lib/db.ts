
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Cek apakah kita berada di lingkungan Vercel
const isVercel = process.env.VERCEL === '1';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
    throw new Error('POSTGRES_URL environment variable is not set.');
}

const pool = new Pool({
  connectionString,
  // Konfigurasi SSL hanya untuk Vercel (production)
  ssl: isVercel ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
