
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env' });

const connectionString = process.env.POSTGRES_URL!;

async function main() {
    if (!connectionString) {
        console.error("🔴 Missing POSTGRES_URL environment variable.");
        process.exit(1);
    }
    
    console.log("🟠 Running migrations...");

    const db = drizzle(postgres(connectionString, { max: 1 }));
    
    try {
        await migrate(db, { migrationsFolder: 'src/drizzle/migrations' });
        console.log("🟢 Migrations applied successfully!");
    } catch(error) {
        console.error("🔴 Error applying migrations:", error);
        process.exit(1);
    }

    process.exit(0);
}

main().catch((err) => {
  console.error("❌ An unexpected error occurred:", err);
  process.exit(1);
});
