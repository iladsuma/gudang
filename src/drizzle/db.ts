import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.POSTGRES_URL!;

// Opsi untuk menonaktifkan IPv6.
// Ini diperlukan untuk mengatasi masalah konektivitas di beberapa lingkungan serverless seperti Vercel.
const client = postgres(connectionString, {
    host: new URL(connectionString).hostname, // Ekstrak host dari connection string
    // @ts-ignore - Opsi 'family' mungkin tidak ada di type definition, tapi didukung oleh Node.js net module
    family: 4, // Paksa penggunaan IPv4
});

export const db = drizzle(client, { schema, logger: true });
