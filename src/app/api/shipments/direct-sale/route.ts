
import { db } from '@/lib/db';
import { shipments, products as productsTable, stockMovements, financialTransactions, accounts } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { user, customerId, cart, accountId, paymentStatus } = await req.json();
        const newShipmentId = `ship_sale_${Date.now()}`;
        const timestamp = new Date();
        const dateStr = timestamp.toISOString().split('T')[0];

        const totalItems = cart.reduce((sum: number, p: any) => sum + p.quantity, 0);
        const totalAmount = cart.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
        const totalProductCost = cart.reduce((sum: number, p: any) => sum + (p.costPrice * p.quantity), 0);

        // Fetch customer name for the record
        const customer = await db.query.customers.findFirst({ where: eq(accounts.id, customerId) });
        const customerName = customer?.name || 'Pelanggan Umum';

        await db.transaction(async (tx) => {
            // 1. Create Shipment (Direct Sale is auto-delivered)
            await tx.insert(shipments).values({
                id: newShipmentId,
                userId: user.id,
                transactionId: `SL-${Date.now().toString().slice(-6)}`,
                customerId: customerId || null,
                customerName: customerName,
                status: 'Terkirim',
                paymentStatus: paymentStatus,
                deliveryMethod: 'Diambil di Toko',
                products: cart,
                totalItems: totalItems,
                totalProductCost: totalProductCost,
                totalAmount: totalAmount,
                totalRevenue: totalAmount,
                createdAt: timestamp,
                paidAt: paymentStatus === 'Lunas' ? timestamp : null,
                accountId: paymentStatus === 'Lunas' ? accountId : null,
                downPayment: paymentStatus === 'Lunas' ? totalAmount : 0,
            });

            // 2. Update stock & Record movement
            for (const item of cart) {
                const currentProduct = await tx.query.products.findFirst({ where: eq(productsTable.id, item.productId) });
                const stockBefore = currentProduct?.stock || 0;
                
                await tx.update(productsTable)
                    .set({ stock: sql`${productsTable.stock} - ${item.quantity}` })
                    .where(eq(productsTable.id, item.productId));

                await tx.insert(stockMovements).values({
                    id: `sm_sale_${Date.now()}_${item.productId}`,
                    productId: item.productId,
                    type: 'Penjualan',
                    quantityChange: -item.quantity,
                    stockBefore: stockBefore,
                    stockAfter: stockBefore - item.quantity,
                    notes: `Penjualan Kasir ${newShipmentId}`,
                    referenceId: newShipmentId,
                });
            }

            // 3. Record Financial Transaction if Lunas
            if (paymentStatus === 'Lunas') {
                await tx.insert(financialTransactions).values({
                    id: `ft_sale_${Date.now()}`,
                    accountId: accountId,
                    type: 'in',
                    amount: totalAmount,
                    category: 'Penjualan Langsung',
                    description: `Penjualan kasir ke ${customerName}`,
                    transactionDate: dateStr,
                    referenceId: newShipmentId,
                });

                await tx.update(accounts)
                    .set({ balance: sql`${accounts.balance} + ${totalAmount}` })
                    .where(eq(accounts.id, accountId));
            }
        });

        const created = await db.query.shipments.findFirst({ where: eq(shipments.id, newShipmentId) });
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error("DIRECT SALE Error:", error);
        return NextResponse.json({ message: String(error) }, { status: 500 });
    }
}
