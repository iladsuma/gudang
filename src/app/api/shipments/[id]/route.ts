
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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const data: Omit<Shipment, 'id' | 'createdAt' | 'status' | 'totalItems' | 'totalAmount' | 'totalProductCost' | 'totalPackingCost'> & { packagingCost: number } = await request.json();
  const db = await readDb();
  
  const shipmentIndex = db.shipments.findIndex((s: Shipment) => s.id === id);

  if (shipmentIndex === -1) {
    return NextResponse.json({ message: 'Pengiriman tidak ditemukan.' }, { status: 404 });
  }

  const originalShipment = db.shipments[shipmentIndex];
  if (originalShipment.status !== 'Proses') {
      return NextResponse.json({ message: 'Hanya pengiriman dengan status "Proses" yang bisa diubah.' }, { status: 400 });
  }

  // Recalculate totals
  const totalItems = data.products.reduce((sum, p) => sum + p.quantity, 0);
  const totalProductCost = data.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const totalPackingCost = data.packagingCost || 0;
  const grandTotal = totalProductCost + totalPackingCost;
    
  const updatedShipment: Shipment = {
      ...originalShipment,
      ...data,
      totalItems,
      totalProductCost,
      totalPackingCost,
      totalAmount: grandTotal,
      products: data.products.map(p => ({ ...p }))
  };

  db.shipments[shipmentIndex] = updatedShipment;
  await writeDb(db);

  return NextResponse.json(updatedShipment);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const db = await readDb();

    const initialLength = db.shipments.length;
    db.shipments = db.shipments.filter((s: Shipment) => s.id !== id);

    if (db.shipments.length === initialLength) {
        return NextResponse.json({ message: 'Pengiriman tidak ditemukan.' }, { status: 404 });
    }

    await writeDb(db);
    return new NextResponse(null, { status: 204 });
}
