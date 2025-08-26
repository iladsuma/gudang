
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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const data: Omit<Supplier, 'id'> = await request.json();
  const db = await readDb();
  
  if (!db.suppliers) db.suppliers = [];
  const supplierIndex = db.suppliers.findIndex((s: Supplier) => s.id === id);

  if (supplierIndex === -1) {
    return NextResponse.json({ message: 'Supplier tidak ditemukan.' }, { status: 404 });
  }
  
  if (db.suppliers.some((s: Supplier) => s.id !== id && s.name.toLowerCase() === data.name.toLowerCase())) {
    return NextResponse.json({ message: 'Supplier lain dengan nama ini sudah ada.' }, { status: 400 });
  }

  const updatedSupplier = { ...db.suppliers[supplierIndex], ...data };
  db.suppliers[supplierIndex] = updatedSupplier;
  await writeDb(db);

  return NextResponse.json(updatedSupplier);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const db = await readDb();

    if (!db.suppliers) db.suppliers = [];
    const initialLength = db.suppliers.length;
    db.suppliers = db.suppliers.filter((s: Supplier) => s.id !== id);

    if (db.suppliers.length === initialLength) {
        return NextResponse.json({ message: 'Supplier tidak ditemukan.' }, { status: 404 });
    }

    await writeDb(db);
    return new NextResponse(null, { status: 204 });
}
