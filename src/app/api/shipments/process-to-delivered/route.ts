
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Shipment, Checkout, ProcessedShipmentSummary, User } from '@/lib/types';

const dbPath = path.resolve(process.cwd(), 'db.json');

async function readDb() {
  const data = await fs.readFile(dbPath, 'utf-8');
  return JSON.parse(data);
}

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function POST(request: Request) {
  const { shipmentIds } = await request.json();
  const db = await readDb();

  const shipmentsToProcess = db.shipments.filter((s: Shipment) => shipmentIds.includes(s.id));
  
  if (shipmentsToProcess.length === 0) {
    return NextResponse.json({ message: "Tidak ada pengiriman yang valid untuk diproses." }, { status: 400 });
  }
  
  if (shipmentsToProcess.some((s: Shipment) => s.status !== 'Pengemasan')) {
    return NextResponse.json({ message: "Hanya pengiriman dengan status 'Pengemasan' yang bisa dikirim." }, { status: 400 });
  }

  // Note: In a real app, user would come from an authenticated session.
  // Here we'll just hardcode or assume an admin user.
  const processorName = "Admin"; 

  const processedSummaries: ProcessedShipmentSummary[] = shipmentsToProcess.map((s: Shipment) => ({
    shipmentId: s.id,
    transactionId: s.transactionId,
    totalAmount: s.totalAmount,
    totalItems: s.totalItems,
  }));

  const totalBatchAmount = processedSummaries.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalBatchItems = processedSummaries.reduce((sum, s) => sum + s.totalItems, 0);

  const newBatchCheckout: Checkout = {
    id: `batch_${Date.now()}`,
    processorName: processorName,
    processedShipments: processedSummaries,
    totalBatchItems: totalBatchItems,
    totalBatchAmount: totalBatchAmount,
    createdAt: new Date().toISOString(),
  };

  db.checkoutHistory.unshift(newBatchCheckout);

  // Update status to 'Terkirim'
  db.shipments.forEach((s: Shipment, index: number) => {
    if (shipmentIds.includes(s.id)) {
      db.shipments[index].status = 'Terkirim';
    }
  });

  await writeDb(db);

  return new NextResponse(null, { status: 204 });
}
