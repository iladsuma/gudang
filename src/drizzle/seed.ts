
import { config } from "dotenv";
import { db } from "./db";
import * as schema from "./schema";
import initialData from '../../db.json';
import { count } from "drizzle-orm";

config({ path: ".env" });

async function seedTable<T extends pgTable>(
    tableName: string,
    table: T,
    data: any[],
) {
    console.log(`Checking table: ${tableName}`);
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
}


async function main() {
    console.log("🌱 Starting to seed the database...");

    await seedTable('users', schema.users, initialData.users);
    await seedTable('products', schema.products, initialData.products);
    await seedTable('expeditions', schema.expeditions, initialData.expeditions);
    await seedTable('packagingOptions', schema.packagingOptions, initialData.packagingOptions);
    await seedTable('customers', schema.customers, initialData.customers);
    await seedTable('suppliers', schema.suppliers, initialData.suppliers);

    console.log("✅ Database seeding check completed.");
    process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error during database seeding:", err);
  process.exit(1);
});
