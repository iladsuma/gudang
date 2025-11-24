import { db } from '@/lib/db';
import { products, stockMovements } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

// GET all products
export async function GET() {
  try {
    const allProducts = await db.query.products.findMany({
      orderBy: [desc(products.code)],
    });
    return NextResponse.json(allProducts, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}

// ADD a new product
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { stock, ...productData } = body;
        const newProduct = {
            ...productData,
            id: `prod_${Date.now()}`,
            stock: stock || 0,
        };

        await db.transaction(async (tx) => {
            await tx.insert(products).values(newProduct);
            if (newProduct.stock > 0) {
                await tx.insert(stockMovements).values({
                    id: `sm_${Date.now()}`,
                    productId: newProduct.id,
                    type: 'Stok Awal',
                    quantityChange: newProduct.stock,
                    stockBefore: 0,
                    stockAfter: newProduct.stock,
                    notes: 'Stok awal saat pembuatan produk',
                })
            }
        });
        
        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        return NextResponse.json({ message }, { status: 500 });
    }
}

// DELETE multiple products
export async function DELETE(req: NextRequest) {
    try {
        const { ids } = await req.json();
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ message: 'IDs are required' }, { status: 400 });
        }
        
        await db.delete(products).where(sql`id IN ${ids}`);
        
        return NextResponse.json({ ids }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        return NextResponse.json({ message }, { status: 500 });
    }
}