
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { shipments, customers, users, products, stockMovements, financialTransactions, accounts } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import type { ShipmentProduct } from '@/lib/types';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { user: userData, customerId, products: productItems, accountId, paymentStatus } = body;

    if (!userData || !customerId || !productItems || !accountId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        const newShipment = await db.transaction(async (tx) => {
            const customer = await tx.query.customers.findFirst({ where: eq(customers.id, customerId) });
            if (!customer) throw new Error('Customer not found');

            const totalItems = productItems.reduce((sum: number, p: ShipmentProduct) => sum + p.quantity, 0);
            const totalProductCost = productItems.reduce((sum: number, p: ShipmentProduct) => sum + p.price * p.quantity, 0);
            const totalAmount = totalProductCost; // No packaging cost for direct sales

            const shipmentData = {
                userId: userData.id,
                transactionId: `POS-${userData.username.toUpperCase()}-${Date.now()}`,
                customerId,
                customerName: customer.name,
                expedition: 'Penjualan Langsung',
                status: 'Terkirim' as const,
                paymentStatus,
                products: productItems,
                totalItems,
                totalProductCost,
                totalPackingCost: 0,
                totalAmount,
                totalRevenue: totalAmount,
                accountId,
                createdAt: new Date(),
                paidAt: paymentStatus === 'Lunas' ? new Date() : undefined,
            };

            const [insertedShipment] = await tx.insert(shipments).values(shipmentData as any).returning();
            
            // Reduce stock
            for (const item of productItems) {
                const product = await tx.query.products.findFirst({ where: eq(products.id, item.productId) });
                if (!product || product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${item.name}`);
                }
                
                await tx.update(products)
                    .set({ stock: sql`${products.stock} - ${item.quantity}` })
                    .where(eq(products.id, item.productId));

                await tx.insert(stockMovements).values({
                    productId: item.productId,
                    referenceId: insertedShipment.id,
                    type: 'Penjualan',
                    quantityChange: -item.quantity,
                    stockBefore: product.stock,
                    stockAfter: product.stock - item.quantity,
                    notes: `Penjualan langsung: ${insertedShipment.transactionId}`
                });
            }
            
            // Create financial transaction if paid
            if (paymentStatus === 'Lunas') {
                 await tx.insert(financialTransactions).values({
                    accountId,
                    type: 'in',
                    amount: totalAmount,
                    category: 'Penjualan Tunai',
                    description: `Penjualan ${insertedShipment.transactionId} kepada ${customer.name}`,
                    transactionDate: new Date().toISOString().split('T')[0],
                    referenceId: insertedShipment.id,
                 });
                 
                 await tx.update(accounts)
                    .set({ balance: sql`${accounts.balance} + ${totalAmount}`})
                    .where(eq(accounts.id, accountId));
            }


            return insertedShipment;
        });

        return NextResponse.json(newShipment);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process direct sale';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
