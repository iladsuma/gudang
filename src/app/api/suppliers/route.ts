
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Supplier } from '@/lib/types';

const dbPath = path.resolve(process.cwd(), 'db.json');

async function readDb() {
  const data = await fs.readFile(dbPath, 'utf-8');
  return JSON.parse(data);
}

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function GET() {
  const db = await readDb();
  if (!db.suppliers) db.suppliers = [];
  const sortedSuppliers = [...db.suppliers].sort((a,b) => a.name.localeCompare(b.name));
  return NextResponse.json(sortedSuppliers);
}

export async function POST(request: Request) {
  const data: Omit<Supplier, 'id'> = await request.json();
  const db = await readDb();
  if (!db.suppliers) db.suppliers = [];

  if (db.suppliers.some((s: Supplier) => s.name.toLowerCase() === data.name.toLowerCase())) {
    return NextResponse.json({ message: 'Nama supplier sudah ada.' }, { status: 400 });
  }

  const newSupplier: Supplier = {
    ...data,
    id: `sup_${Date.now()}`,
  };

  db.suppliers.push(newSupplier);
  await writeDb(db);
  return NextResponse.json(newSupplier, { status: 201 });
}
