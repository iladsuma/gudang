
import { config } from "dotenv";
import { db } from "./db";
import * as schema from "./schema";
import initialData from '../../db.json';
import { eq, count } from "drizzle-orm";

// Load environment variables from .env file
config({ path: ".env" });

async function main() {
    console.log("🌱 Starting to seed the database...");

    // Check if there are already users in the database
    const userCountResult = await db.select({ value: count() }).from(schema.users);
    const userCount = userCountResult[0].value;

    if (userCount > 0) {
        console.log("Database already seeded. Skipping.");
        process.exit(0);
    }
    
    console.log("Database is empty. Seeding with initial data...");

    // Seeding users
    console.log("Seeding users...");
    await db.insert(schema.users).values(initialData.users).onConflictDoNothing();
    
    // Seeding products
    console.log("Seeding products...");
    await db.insert(schema.products).values(initialData.products).onConflictDoNothing();
    
    // Seeding expeditions
    console.log("Seeding expeditions...");
    await db.insert(schema.expeditions).values(initialData.expeditions).onConflictDoNothing();

    // Seeding packaging options
    console.log("Seeding packaging options...");
    await db.insert(schema.packagingOptions).values(initialData.packagingOptions).onConflictDoNothing();

    // Seeding customers
    console.log("Seeding customers...");
    await db.insert(schema.customers).values(initialData.customers).onConflictDoNothing();

    // Seeding suppliers
    console.log("Seeding suppliers...");
    await db.insert(schema.suppliers).values(initialData.suppliers).onConflictDoNothing();

    console.log("✅ Database seeding completed successfully.");
    process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error during database seeding:", err);
  process.exit(1);
});
