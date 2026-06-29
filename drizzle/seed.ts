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

    // Membersihkan data lama untuk menghindari duplikasi saat seeding ulang
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

    // Membaca data dari db.json
    const dbPath = path.join(process.cwd(), "db.json");
    const fileContent = await fs.readFile(dbPath, "utf-8");
    const data = JSON.parse(fileContent);

    // Memasukkan data baru
    if (data.users && data.users.length) {
      console.log(`Inserting ${data.users.length} users...`);
      await db.insert(schema.users).values(data.users);
    }
    
    if (data.accounts && data.accounts.length) {
      console.log(`Inserting ${data.accounts.length} accounts...`);
      await db.insert(schema.accounts).values(data.accounts);
    }
    
    if (data.products && data.products.length) {
      console.log(`Inserting ${data.products.length} product categories...`);
      await db.insert(schema.products).values(data.products);
    }
    
    if (data.expeditions && data.expeditions.length) {
      console.log(`Inserting ${data.expeditions.length} expeditions...`);
      await db.insert(schema.expeditions).values(data.expeditions);
    }
    
    console.log("Seeding finished successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

main();