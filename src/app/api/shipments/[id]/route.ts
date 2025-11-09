
import { db } from '@/lib/db';
import { shipments } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Recalculate totals server-side for safety
    const { products: shipmentProducts, packagingCost, ...restOfBody } = body;
    const totalItems = shipmentProducts.reduce((sum: number, p: any) => sum + p.quantity, 0);
    const totalProductCost = shipmentProducts.reduce((sum: number, p: any) => sum + p.price * p.quantity, 0);
    const totalPackingCost = packagingCost || 0;
    const totalAmount = totalProductCost + totalPackingCost;
    const totalRevenue = totalAmount; // For now, revenue is the same as total amount

    const updateData = {
        ...restOfBody,
        products: shipmentProducts,
        totalItems,
        totalProductCost,
        totalPackingCost,
        totalAmount,
        totalRevenue
    };

    const [updatedShipment] = await db
      .update(shipments)
      .set(updateData)
      .where(eq(shipments.id, id))
      .returning();

    if (!updatedShipment) {
      return NextResponse.json({ message: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json(updatedShipment);
  } catch (error) {
    console.error(`Failed to update shipment ${params.id}:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: 'Failed to update shipment', error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const [deletedShipment] = await db.delete(shipments).where(eq(shipments.id, id)).returning();

    if (!deletedShipment) {
      return NextResponse.json({ message: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error(`Failed to delete shipment ${params.id}:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: 'Failed to delete shipment', error: message }, { status: 500 });
  }
}
