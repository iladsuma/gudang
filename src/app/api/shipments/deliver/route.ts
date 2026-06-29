import { db } from '@/lib/db';
import { shipments, customers } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
import { inArray, eq } from 'drizzle-orm';
import { sendOrderFinishedNotification } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { shipmentIds } = await req.json();
        
        if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
            return NextResponse.json({ message: 'Pilih pesanan' }, { status: 400 });
        }

        await db.transaction(async (tx) => {
            await tx.update(shipments)
                .set({ status: 'Terkirim' }) // Marks as finished/archived
                .where(inArray(shipments.id, shipmentIds));
            
            // Send notifications to customers
            for (const id of shipmentIds) {
                const shipment = await tx.query.shipments.findFirst({ where: eq(shipments.id, id) });
                if (shipment) {
                    // Since customerId is nullable, we use a dummy customer object with the manual name
                    const custInfo = { name: shipment.customerName, phone: null }; 
                    await sendOrderFinishedNotification(shipment, custInfo);
                }
            }
        });

        return NextResponse.json({ count: shipmentIds.length }, { status: 200 });
    } catch (error) {
        console.error("DELIVER API Error:", error);
        return NextResponse.json({ message: String(error) }, { status: 500 });
    }
}