import { db } from '@/lib/db';
import { shipments } from '@/app/drizzle/schema';
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
    
    // Sanitize userId for nullability
    const { userId, ...updateData } = body;
    const sanitizedUserId = (userId && userId.trim() !== '') ? userId : null;

    // Recalculate courier cost (750 profit/km from 1000 fee, so 250 cost/km)
    const distance = body.deliveryDistance || 0;
    const deliveryCost = distance * 250;

    await db.update(shipments)
      .set({
          ...updateData,
          userId: sanitizedUserId,
          deliveryCost: deliveryCost
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