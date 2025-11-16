
import { config } from "dotenv";
import { db } from "./db";
import * as schema from "./schema";
import initialData from '../../db.json';
import { PgTable } from "drizzle-orm/pg-core";
import { count } from "drizzle-orm";

config({ path: ".env" });

async function seedTable<T extends PgTable>(
    tableName: string,
    table: T,
    data: any[],
) {
    console.log(`Checking table: ${tableName}`);
    try {
        const tableCountResult = await db.select({ value: count() }).from(table);
        const tableCount = tableCountResult[0].value;

        if (tableCount > 0) {
            console.log(`Table ${tableName} already seeded. Skipping.`);
            return;
        }

        if (data.length > 0) {
            console.log(`Seeding ${tableName}...`);
            await db.insert(table).values(data).onConflictDoNothing();
        } else {
            console.log(`No data to seed for ${tableName}.`);
        }
    } catch (error) {
        // This can happen if the table doesn't exist yet, which is fine on the first run
        // after manual schema creation. The important part is that subsequent builds don't re-seed.
        if (error instanceof Error && error.message.includes('does not exist')) {
            console.warn(`🟡 Table ${tableName} does not exist. This is expected if you just created the schema. Seeding will be skipped for now.`);
        } else {
            console.error(`🔴 Error while checking/seeding table ${tableName}:`, error);
            // We don't exit the process to allow the build to continue
        }
    }
}


async function main() {
    console.log("🌱 Starting to seed the database...");

    // await seedTable('users', schema.users, initialData.users); // User login data comes from db.json directly
    await seedTable('products', schema.products, initialData.products);
    await seedTable('expeditions', schema.expeditions, initialData.expeditions);
    await seedTable('packagingOptions', schema.packagingOptions, initialData.packagingOptions);
    await seedTable('customers', schema.customers, initialData.customers);
    await seedTable('suppliers', schema.suppliers, initialData.suppliers);
    await seedTable('accounts', schema.accounts, (initialData as any).accounts);

    console.log("✅ Database seeding check completed.");
    process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error during database seeding:", err);
  process.exit(1);
});
