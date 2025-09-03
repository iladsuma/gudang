
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {
    shipments as shipmentsTable,
    products as productsTable,
    stockMovements as stockMovementsTable,
    customers as customersTable,
    users as usersTable
} from '@/drizzle/schema';
import {eq, sql} from 'drizzle-orm';
import type {Shipment, ShipmentProduct} from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {user: userAuth, customerId, products} = body;
        
        let newShipment: Shipment;

        await db.transaction(async (tx) => {
            const customer = await tx.query.customers.findFirst({where: eq(customersTable.id, customerId)});
            const user = await tx.query.users.findFirst({where: eq(usersTable.username, userAuth.username)});

            if (!customer) throw new Error('Customer not found');
            if (!user) throw new Error('User not found');
            if (!products || products.length === 0) throw new Error('Cannot process sale with no products');

            const totalItems = products.reduce((sum: number, p: ShipmentProduct) => sum + p.quantity, 0);
            const totalAmount = products.reduce((sum: number, p: ShipmentProduct) => sum + p.price * p.quantity, 0);

            const transactionId = `POS-${user.username.toUpperCase()}-${Date.now()}`;

            const newShipmentData: Omit<Shipment, 'id' | 'createdAt'> = {
                userId: user.id,
                transactionId,
                customerId: customer.id,
                customerName: customer.name,
                expedition: 'Penjualan Langsung',
                packagingId: '', // No packaging for direct sale
                status: 'Terkirim',
                products: products,
                totalItems,
                totalProductCost: totalAmount,
                totalPackingCost: 0,
                totalAmount: totalAmount,
                user: user.username, // keep user field for compatibility if needed elsewhere
            };

            const [insertedShipment] = await tx.insert(shipmentsTable).values(newShipmentData as any).returning();
            newShipment = insertedShipment;

             for (const product of products) {
                const currentProduct = await tx.query.products.findFirst({
                    where: eq(productsTable.id, product.productId),
                });

                if (!currentProduct) {
                    throw new Error(`Product ${product.name} not found.`);
                }
                if (currentProduct.stock < product.quantity) {
                    throw new Error(`Stok tidak cukup untuk produk ${product.name}.`);
                }
                
                const stockBefore = currentProduct.stock;
                const stockAfter = stockBefore - product.quantity;
                
                await tx.update(productsTable)
                    .set({stock: sql`${productsTable.stock} - ${product.quantity}`})
                    .where(eq(productsTable.id, product.productId));

                await tx.insert(stockMovementsTable).values({
                    productId: product.productId,
                    referenceId: newShipment.id,
                    type: 'Penjualan',
                    quantityChange: -product.quantity,
                    stockBefore: stockBefore,
                    stockAfter: stockAfter,
                    notes: `Penjualan langsung: ${newShipment.transactionId}`,
                });
            }
        });

        return NextResponse.json(newShipment!, {status: 201});
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process direct sale';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
