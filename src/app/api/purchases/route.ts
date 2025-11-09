
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import {
    purchases as purchasesTable,
    products as productsTable,
    stockMovements as stockMovementsTable,
    financialTransactions as ftTable,
    accounts
} from '@/drizzle/schema';
import { desc, eq, sql } from 'drizzle-orm';
import type { Purchase } from '@/lib/types';
import { format } from 'date-fns';

export async function GET() {
    try {
        const allPurchases = await db.select().from(purchasesTable).orderBy(desc(purchasesTable.createdAt));
        return NextResponse.json(allPurchases);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { supplierId, supplierName, purchaseNumber, accountId, paymentStatus, products } = body;
        
        let newPurchase: Purchase;

        if (!products || products.length === 0) {
            throw new Error("Purchase must have at least one product.");
        }

        await db.transaction(async (tx) => {
            const totalAmount = products.reduce((sum: number, p: any) => sum + p.costPrice * p.quantity, 0);

            const purchaseData: Omit<Purchase, 'id' | 'createdAt'> = {
                supplierId,
                supplierName,
                purchaseNumber,
                accountId,
                status: 'Selesai',
                paymentStatus,
                products,
                totalAmount,
            };

            const [insertedPurchase] = await tx.insert(purchasesTable).values(purchaseData as any).returning();
            newPurchase = insertedPurchase;

            for (const product of products) {
                const currentProduct = await tx.query.products.findFirst({ where: eq(productsTable.id, product.productId) });
                if (!currentProduct) {
                    throw new Error(`Product with ID ${product.productId} not found during purchase process.`);
                }
                const stockBefore = currentProduct.stock;
                const stockAfter = stockBefore + product.quantity;

                await tx.update(productsTable)
                    .set({ stock: sql`${productsTable.stock} + ${product.quantity}` })
                    .where(eq(productsTable.id, product.productId));

                await tx.insert(stockMovementsTable).values({
                    productId: product.productId,
                    referenceId: newPurchase.id,
                    type: 'Pembelian',
                    quantityChange: product.quantity,
                    stockBefore: stockBefore,
                    stockAfter: stockAfter,
                    notes: `Pembelian dari ${supplierName} - No: ${purchaseNumber}`,
                });
            }

            if (paymentStatus === 'Lunas') {
                if (!accountId) throw new Error("Account ID is required for paid purchases.");
                await tx.insert(ftTable).values({
                    accountId,
                    type: 'out',
                    amount: totalAmount,
                    category: 'Pembelian Stok',
                    description: `Pembelian ${purchaseNumber} dari ${supplierName}`,
                    transactionDate: format(new Date(), 'yyyy-MM-dd'),
                    referenceId: newPurchase.id,
                });
                
                await tx.update(accounts)
                    .set({ balance: sql`${accounts.balance} - ${totalAmount}`})
                    .where(eq(accounts.id, accountId));
            }

        });

        return NextResponse.json(newPurchase!, { status: 201 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create purchase';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
