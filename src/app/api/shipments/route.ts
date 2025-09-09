
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {shipments as shipmentsTable, customers, users as usersTable, products as productsTable, financialTransactions as ftTable} from '@/drizzle/schema';
import {desc, eq} from 'drizzle-orm';
import type {Shipment, ShipmentProduct} from '@/lib/types';
import { format } from 'date-fns';

export async function GET() {
    try {
        const allShipments = await db.select().from(shipmentsTable).orderBy(desc(shipmentsTable.createdAt));
        return NextResponse.json(allShipments);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch shipments'}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        let newShipment: Shipment;
        await db.transaction(async (tx) => {
            const body = await request.json();
            const {customerId, packagingCost, user: username, products, ...restOfBody} = body;
            
            const customer = await tx.query.customers.findFirst({where: eq(customers.id, customerId)});
            const user = await tx.query.users.findFirst({where: eq(usersTable.username, username)});

            if (!customer) throw new Error('Customer not found');
            if (!user) throw new Error('User not found');
            if (!products || products.length === 0) throw new Error('Cannot process shipment with no products');

            const totalItems = products.reduce((sum: number, p: any) => sum + p.quantity, 0);
            const totalProductCost = products.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
            const totalAmount = totalProductCost + packagingCost;
            
            const productsWithCostPrice = await Promise.all(products.map(async (p: ShipmentProduct) => {
                const productData = await tx.query.products.findFirst({
                    where: eq(productsTable.id, p.productId),
                    columns: { costPrice: true }
                });
                return { ...p, costPrice: productData?.costPrice || 0 };
            }));

            const newShipmentData: Omit<Shipment, 'id' | 'createdAt'> = {
                ...restOfBody,
                userId: user.id,
                customerName: customer.name,
                customerId: customer.id,
                status: 'Proses',
                products: productsWithCostPrice,
                totalItems,
                totalProductCost,
                totalPackingCost: packagingCost,
                totalAmount,
                totalRevenue: totalAmount,
            };

            const [insertedShipment] = await tx.insert(shipmentsTable).values(newShipmentData as any).returning();
            newShipment = insertedShipment;
            
            // If the shipment is created with status "Terkirim" (like from direct sales), create financial record.
            if(newShipment.status === 'Terkirim') {
                 await tx.insert(ftTable).values({
                    type: 'in',
                    amount: newShipment.totalAmount,
                    category: 'Penjualan Tunai',
                    description: `Penjualan ${newShipment.transactionId} kepada ${newShipment.customerName}`,
                    transactionDate: format(new Date(), 'yyyy-MM-dd'),
                    referenceId: newShipment.id,
                });
            }
        });
        return NextResponse.json(newShipment!, {status: 201});
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create shipment';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
