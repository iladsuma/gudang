
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// This is the raw content of the schema file.
// In a real application, you might fetch this from the server at build time.
const schemaContent = `
import { pgTable, text, varchar, real, integer, timestamp, pgEnum, jsonb, boolean, date } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
export const shipmentStatusEnum = pgEnum('shipment_status', ['Proses', 'Pengemasan', 'Terkirim']);
export const purchaseStatusEnum = pgEnum('purchase_status', ['Selesai', 'Draf']);
export const stockMovementTypeEnum = pgEnum('stock_movement_type', ['Stok Awal', 'Penjualan', 'Stok Opname', 'Pembelian', 'Retur']);
export const transactionTypeEnum = pgEnum('transaction_type', ['in', 'out']);


export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => \`usr_\${Date.now()}\`),
  username: varchar('username', { length: 255 }).notNull().unique(),
  role: userRoleEnum('role').notNull(),
  password: text('password').notNull(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => \`prod_\${Date.now()}\`),
  code: varchar('code', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  price: real('price').notNull(),
  costPrice: real('cost_price').notNull(),
  stock: integer('stock').notNull(),
  minStock: integer('min_stock').notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  category: varchar('category', { length: 255 }).notNull(),
  imageUrl: text('image_url'),
});

export const expeditions = pgTable('expeditions', {
  id: text('id').primaryKey().$defaultFn(() => \`exp_\${Date.now()}\`),
  name: varchar('name', { length: 255 }).notNull(),
});

export const packagingOptions = pgTable('packaging_options', {
  id: text('id').primaryKey().$defaultFn(() => \`pkg_\${Date.now()}\`),
  name: varchar('name', { length: 255 }).notNull(),
  cost: real('cost').notNull(),
});

export const customers = pgTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => \`cust_\${Date.now()}\`),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
});

export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey().$defaultFn(() => \`sup_\${Date.now()}\`),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
});

export const shipments = pgTable('shipments', {
  id: text('id').primaryKey().$defaultFn(() => \`ship_\${Date.now()}\`),
  userId: text('user_id').notNull().references(() => users.id),
  transactionId: varchar('transaction_id', { length: 255 }).notNull(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  expedition: varchar('expedition', { length: 255 }).notNull(),
  packagingId: text('packaging_id'),
  status: shipmentStatusEnum('status').notNull(),
  receipt: jsonb('receipt'), // { fileName: string, dataUrl: string }
  products: jsonb('products').notNull(), // ShipmentProduct[]
  totalItems: integer('total_items').notNull(),
  totalProductCost: real('total_product_cost').notNull(),
  totalPackingCost: real('total_packing_cost').notNull(),
  totalAmount: real('total_amount').notNull(),
  totalRevenue: real('total_revenue').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const purchases = pgTable('purchases', {
    id: text('id').primaryKey().$defaultFn(() => \`purch_\${Date.now()}\`),
    supplierId: text('supplier_id').notNull().references(() => suppliers.id),
    supplierName: varchar('supplier_name', { length: 255 }).notNull(),
    purchaseNumber: varchar('purchase_number', { length: 255 }).notNull(),
    status: purchaseStatusEnum('status').notNull(),
    products: jsonb('products').notNull(), // PurchaseProduct[]
    totalAmount: real('total_amount').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const returns = pgTable('returns', {
    id: text('id').primaryKey().$defaultFn(() => \`ret_\${Date.now()}\`),
    originalShipmentId: text('original_shipment_id').notNull(),
    originalTransactionId: varchar('original_transaction_id', { length: 255 }).notNull(),
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    products: jsonb('products').notNull(), // ReturnedProduct[]
    reason: text('reason').notNull(),
    totalAmount: real('total_amount').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});


export const stockMovements = pgTable('stock_movements', {
    id: text('id').primaryKey().$defaultFn(() => \`sm_\${Date.now()}\`),
    productId: text('product_id').notNull().references(() => products.id),
    referenceId: text('reference_id'),
    type: stockMovementTypeEnum('type').notNull(),
    quantityChange: integer('quantity_change').notNull(),
    stockBefore: integer('stock_before').notNull(),
    stockAfter: integer('stock_after').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const financialTransactions = pgTable('financial_transactions', {
  id: text('id').primaryKey().$defaultFn(() => \`ft_\${Date.now()}\`),
  type: transactionTypeEnum('type').notNull(), // 'in' or 'out'
  amount: real('amount').notNull(),
  category: varchar('category', { length: 255 }).notNull(),
  description: text('description').notNull(),
  transactionDate: date('transaction_date').notNull(),
  referenceId: text('reference_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
`;

export default function DatabaseSchemaPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user?.role !== 'admin') {
            router.push('/shipments');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="container mx-auto p-4 md:p-8 space-y-6">
                 <Skeleton className="h-8 w-48" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                       <Skeleton className="h-96 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!user || user.role !== 'admin') {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Anda tidak memiliki akses ke halaman ini. Mengalihkan...</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Button asChild variant="outline">
                <Link href="/settings">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Pengaturan
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Skema Database</CardTitle>
                    <CardDescription>
                       Ini adalah isi dari file <code>src/drizzle/schema.ts</code>, yang mendefinisikan struktur tabel database aplikasi.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <ScrollArea className="h-[60vh] w-full rounded-md border bg-muted p-4">
                        <pre>
                            <code className="language-typescript">
                                {schemaContent.trim()}
                            </code>
                        </pre>
                   </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
