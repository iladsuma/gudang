import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/app/drizzle/schema";
import fs from "fs/promises";
import path from "path";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const main = async () => {
  try {
    console.log("Seeding database...");

    // Delete all existing data
    await db.delete(schema.users);
    await db.delete(schema.accounts);
    await db.delete(schema.products);
    await db.delete(schema.expeditions);
    await db.delete(schema.packagingOptions);
    await db.delete(schema.customers);
    await db.delete(schema.suppliers);
    await db.delete(schema.shipments);
    await db.delete(schema.purchases);
    await db.delete(schema.returns);
    await db.delete(schema.stockMovements);
    await db.delete(schema.financialTransactions);
    
    console.log("Existing data cleared.");


    // Read data from db.json
    const dbPath = path.join(process.cwd(), "db.json");
    const fileContent = await fs.readFile(dbPath, "utf-8");
    const data = JSON.parse(fileContent);

    // Insert new data
    await db.insert(schema.users).values(data.users);
    await db.insert(schema.accounts).values(data.accounts);
    await db.insert(schema.products).values(data.products);
    await db.insert(schema.expeditions).values(data.expeditions);
    await db.insert(schema.packagingOptions).values(data.packagingOptions);
    await db.insert(schema.customers).values(data.customers);
    await db.insert(schema.suppliers).values(data.suppliers);
    
    console.log("Seeding finished.");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to seed database");
  }
};

main();