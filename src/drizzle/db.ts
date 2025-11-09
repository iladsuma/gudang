
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import * as schema from './schema';

config({ path: '.env' });

const connectionString = process.env.POSTGRES_URL!;

if (!connectionString) {
    throw new Error('POSTGRES_URL is not set in the environment variables');
}

// Disable prefetching for serverless environments
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema, logger: true });
