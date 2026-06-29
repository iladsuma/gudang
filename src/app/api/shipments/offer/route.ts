import { db } from '@/lib/db';
import { shipments, users } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
import { inArray, eq } from 'drizzle-orm';
import { sendTailorAssignmentNotification } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { shipmentIds, users: assignedUsers } = await req.json();
        
        if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
            return NextResponse.json({ message: 'Pilih pesanan terlebih dahulu' }, { status: 400 });
        }

        const userIdsString = assignedUsers.map((u: any) => u.id).join(',');

        await db.transaction(async (tx) => {
            // Update shipments with the assigned user IDs
            await tx.update(shipments)
                .set({ userId: userIdsString })
                .where(inArray(shipments.id, shipmentIds));
            
            // Send WA notifications
            for (const shipmentId of shipmentIds) {
                const shipment = await tx.query.shipments.findFirst({ where: eq(shipments.id, shipmentId) });
                if (shipment) {
                    for (const tailor of assignedUsers) {
                        await sendTailorAssignmentNotification(shipment, tailor);
                    }
                }
            }
        });

        return NextResponse.json({ count: shipmentIds.length }, { status: 200 });
    } catch (error) {
        console.error("OFFER API Error:", error);
        return NextResponse.json({ message: String(error) }, { status: 500 });
    }
}