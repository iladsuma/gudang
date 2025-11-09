
import { db } from '@/drizzle/db';
import { shipments, products, stockMovements, financialTransactions } from '@/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { ShipmentProduct, Customer } from '@/lib/types';
import { getNotificationContext } from '@/context/notification-context';


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, customerId, products: saleProducts, accountId, paymentStatus } = body;

        if (!userId || !customerId || !saleProducts || saleProducts.length === 0 || !paymentStatus) {
            return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
        }
        
        if (paymentStatus === 'Lunas' && !accountId) {
             return NextResponse.json({ message: 'Akun pembayaran harus dipilih untuk transaksi lunas.' }, { status: 400 });
        }
        
        const customer = await db.query.customers.findFirst({ where: eq(db.query.customers.findFirst.table.id, customerId) });
        if (!customer) {
            return NextResponse.json({ message: 'Pelanggan tidak ditemukan' }, { status: 404 });
        }

        const productIds = saleProducts.map((p: ShipmentProduct) => p.productId);
        const dbProducts = await db.query.products.findMany({ where: inArray(products.id, productIds) });
        const productMap = new Map(dbProducts.map(p => [p.id, p]));

        // --- Start Transaction ---
        const newShipment = await db.transaction(async (tx) => {
            let totalProductCost = 0;
            let totalCOGS = 0;

            // 1. Validate stock and prepare product data
            for (const saleProduct of saleProducts) {
                const dbProduct = productMap.get(saleProduct.productId);
                if (!dbProduct || dbProduct.stock < saleProduct.quantity) {
                    tx.rollback();
                    throw new Error(`Stok untuk produk "${saleProduct.name}" tidak mencukupi.`);
                }
                 totalProductCost += dbProduct.price * saleProduct.quantity;
                 totalCOGS += dbProduct.costPrice * saleProduct.quantity;
            }

            // 2. Create Shipment
            const transactionId = `SALE/${Date.now()}`;
            const [createdShipment] = await tx.insert(shipments).values({
                userId,
                transactionId,
                customerId,
                customerName: customer.name,
                expedition: 'Penjualan Langsung',
                packagingId: 'pkg_direct_sale', // Placeholder for direct sales
                accountId: paymentStatus === 'Lunas' ? accountId : null,
                status: 'Terkirim', // Direct sales are immediately considered 'Delivered'
                paymentStatus,
                products: saleProducts,
                totalItems: saleProducts.reduce((sum: number, p: ShipmentProduct) => sum + p.quantity, 0),
                totalProductCost: totalProductCost,
                totalPackingCost: 0,
                totalAmount: totalProductCost, // No packing cost for direct sale
                totalRevenue: totalProductCost,
            }).returning();
            
            // 3. Update stock and create stock movements for each product
            for (const saleProduct of saleProducts) {
                const dbProduct = productMap.get(saleProduct.productId)!;
                const newStock = dbProduct.stock - saleProduct.quantity;
                
                await tx.update(products).set({ stock: newStock }).where(eq(products.id, saleProduct.productId));
                
                await tx.insert(stockMovements).values({
                    productId: saleProduct.productId,
                    referenceId: createdShipment.id,
                    type: 'Penjualan',
                    quantityChange: -saleProduct.quantity,
                    stockBefore: dbProduct.stock,
                    stockAfter: newStock,
                    notes: `Penjualan langsung via kasir: ${transactionId}`,
                });
            }
            
            // 4. If paid, create financial transaction
            if (paymentStatus === 'Lunas') {
                 await tx.insert(financialTransactions).values({
                    accountId: accountId,
                    type: 'in',
                    amount: totalProductCost,
                    category: 'Penjualan Langsung',
                    description: `Penjualan dari transaksi ${transactionId}`,
                    transactionDate: new Date().toISOString().split('T')[0],
                    referenceId: createdShipment.id,
                });
            }
            
            return createdShipment;
        });
        // --- End Transaction ---

        return NextResponse.json(newShipment);

    } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal memproses penjualan langsung.";
        console.error("Direct sale error:", error);
        return NextResponse.json({ message }, { status: 500 });
    }
}
