import { db } from '@/lib/db';
import { products } from '@/app/drizzle/schema';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Read data from db.json
    const dbPath = path.join(process.cwd(), "db.json");
    const fileContent = await fs.readFile(dbPath, "utf-8");
    const data = JSON.parse(fileContent);

    if (!data.products || data.products.length === 0) {
      return NextResponse.json({ message: "No products found in db.json" }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      // Clear existing products first to avoid duplicates or old data
      await tx.delete(products);
      
      // Insert products from db.json
      await tx.insert(products).values(data.products);
    });

    return NextResponse.json({ message: "Master data initialized successfully", count: data.products.length }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error("Seed Error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
