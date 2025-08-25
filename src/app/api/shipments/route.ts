
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Shipment } from '@/lib/types';

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
  const sortedShipments = [...db.shipments].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(sortedShipments);
}

export async function POST(request: Request) {
  const data: Omit<Shipment, 'id' | 'createdAt' | 'status' | 'totalItems' | 'totalAmount' | 'totalProductCost' | 'totalPackingCost'> & { packagingCost: number } = await request.json();
  const db = await readDb();

  const totalItems = data.products.reduce((sum, p) => sum + p.quantity, 0);
  const totalProductCost = data.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const totalPackingCost = data.packagingCost || 0;
  const grandTotal = totalProductCost + totalPackingCost;

  const newShipment: Shipment = {
    ...data,
    id: `ship_${Date.now()}_${Math.random()}`,
    status: 'Proses',
    createdAt: new Date().toISOString(),
    totalItems,
    totalProductCost,
    totalPackingCost,
    totalAmount: grandTotal,
    products: data.products.map(p => ({ ...p }))
  };

  db.shipments.unshift(newShipment);
  await writeDb(db);
  return NextResponse.json(newShipment, { status: 201 });
}
