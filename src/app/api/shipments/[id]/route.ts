import { db } from '@/lib/db';
import { shipments, appSettings } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET a single shipment
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, id),
    });

    if (!shipment) {
      return NextResponse.json({ message: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json(shipment, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}

// UPDATE a shipment
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    
    // Fetch current rates from settings
    const settings = await db.select().from(appSettings);
    const feePerKm = parseInt(settings.find(s => s.key === 'courier_fee_per_km')?.value || '1000');
    const fuelConsumption = parseFloat(settings.find(s => s.key === 'courier_fuel_consumption')?.value || '40');
    const fuelPrice = parseFloat(settings.find(s => s.key === 'fuel_price')?.value || '10000');
    
    const costPerKm = fuelPrice / fuelConsumption;

    // Sanitize userId for nullability
    const { userId, ...updateData } = body;
    const sanitizedUserId = (userId && userId.trim() !== '') ? userId : null;

    // Recalculate courier values
    const distance = body.deliveryDistance || 0;
    const deliveryFee = distance * feePerKm;
    const deliveryCost = distance * costPerKm;

    await db.update(shipments)
      .set({
          ...updateData,
          userId: sanitizedUserId,
          deliveryFee: deliveryFee,
          deliveryCost: deliveryCost,
          deliveryDistance: distance,
      })
      .where(eq(shipments.id, id));

    const updatedShipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, id),
    });

    return NextResponse.json(updatedShipment, { status: 200 });
  } catch (error) {
    console.error("PATCH Shipment API Error:", error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}

// DELETE a shipment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    await db.delete(shipments).where(eq(shipments.id, id));
    return NextResponse.json({ id }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
