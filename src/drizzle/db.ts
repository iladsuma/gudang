
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config } from 'dotenv';

config({ path: '.env' });

const connectionString = process.env.POSTGRES_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
// Set a connection timeout to prevent hanging connections
const client = postgres(connectionString, {
    prepare: false,
    connect_timeout: 10
});

export const db = drizzle(client, { schema, logger: true });
