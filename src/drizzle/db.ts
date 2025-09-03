
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.POSTGRES_URL!;

// This is the simplest and most robust way to connect,
// letting the connection string from Supabase (via environment variables)
// handle the pooling and network configuration.
const client = postgres(connectionString);

export const db = drizzle(client, { schema, logger: true });
