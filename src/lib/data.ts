
import type { 
    Shipment, 
    Expedition, 
    Packaging, 
    User, 
    Customer, 
    Supplier,
    Product,
    Account,
    FinancialTransaction,
    Purchase,
    Return,
    SalesProfitReportData,
    Transfer,
    StockMovement
} from './types';
import { db } from './db';
import { users as usersSchema, products as productsSchema, expeditions as expeditionsSchema, packagingOptions as packagingOptionsSchema, customers as customersSchema, suppliers as suppliersSchema, shipments as shipmentsSchema, purchases as purchasesSchema, returns as returnsSchema, stockMovements as stockMovementsSchema, accounts as accountsSchema, financialTransactions as financialTransactionsSchema } from '@/app/drizzle/schema';
import { eq, and, desc, asc, gte, lte, inArray, sql } from 'drizzle-orm';


// =================================
// User Functions
// =================================
export async function getUsers(): Promise<User[]> {
    return await db.select().from(usersSchema);
}

export async function addUser(user: Omit<User, 'id'>): Promise<User> {
    const newUser = { ...user, id: `usr_${Date.now()}` };
    const result = await db.insert(usersSchema).values(newUser).returning();
    return result[0];
}

export async function updateUser(id: string, user: Partial<User>): Promise<User> {
     const result = await db.update(usersSchema).set(user).where(eq(usersSchema.id, id)).returning();
     return result[0];
}

export async function deleteUser(id: string): Promise<{ id: string }> {
    await db.delete(usersSchema).where(eq(usersSchema.id, id));
    return { id };
}


// =================================
// Shipment Functions
// =================================
export async function getShipments(): Promise<Shipment[]> {
    const results = await db.query.shipments.findMany({
        orderBy: [desc(shipmentsSchema.createdAt)],
    });
    // Drizzle with neon-http returns JSONB as strings, so we need to parse them.
    return results.map(s => ({
        ...s,
        products: typeof s.products === 'string' ? JSON.parse(s.products) : s.products,
        receipt: typeof s.receipt === 'string' ? JSON.parse(s.receipt) : s.receipt,
    }));
}

export async function addShipment(shipment: Omit<Shipment, 'id' | 'createdAt' | 'status'>): Promise<Shipment> {
    const newShipment = { 
        ...shipment, 
        id: `ship_${Date.now()}`, 
        status: 'Proses' as const,
        createdAt: new Date()
    };
    
    // In a real scenario, this would be a transaction.
    // 1. Create shipment
    const result = await db.insert(shipmentsSchema).values(newShipment).returning();
    const createdShipment = result[0];
    
    return {
        ...createdShipment,
        products: typeof createdShipment.products === 'string' ? JSON.parse(createdShipment.products) : createdShipment.products,
        receipt: typeof createdShipment.receipt === 'string' ? JSON.parse(createdShipment.receipt) : createdShipment.receipt,
    };
}

export async function updateShipment(id: string, shipment: Partial<Shipment>): Promise<Shipment> {
    const result = await db.update(shipmentsSchema).set(shipment).where(eq(shipmentsSchema.id, id)).returning();
    const updatedShipment = result[0];
     return {
        ...updatedShipment,
        products: typeof updatedShipment.products === 'string' ? JSON.parse(updatedShipment.products) : updatedShipment.products,
        receipt: typeof updatedShipment.receipt === 'string' ? JSON.parse(updatedShipment.receipt) : updatedShipment.receipt,
    };
}


export async function deleteShipment(id: string): Promise<{ id: string }> {
    await db.delete(shipmentsSchema).where(eq(shipmentsSchema.id, id));
    return { id };
}

export async function processShipmentsToPackaging(shipmentIds: string[], user: User | null): Promise<{ count: number }> {
    if (!user) throw new Error("User must be logged in.");

    const shipmentsToProcess = await db.select().from(shipmentsSchema).where(inArray(shipmentsSchema.id, shipmentIds));
    
    for(const shipment of shipmentsToProcess) {
        if (shipment.status !== 'Proses') continue;
        
        await db.update(shipmentsSchema).set({ status: 'Pengemasan' }).where(eq(shipmentsSchema.id, shipment.id));
    }
    return { count: shipmentsToProcess.length };
}

export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<{ count: number }> {
     const shipmentsToProcess = await db.select().from(shipmentsSchema).where(inArray(shipmentsSchema.id, shipmentIds));

     await db.transaction(async (tx) => {
        for (const shipment of shipmentsToProcess) {
            if (shipment.status !== 'Pengemasan') continue;

            const parsedProducts = typeof shipment.products === 'string' ? JSON.parse(shipment.products) : shipment.products;

            for (const product of parsedProducts) {
                 const currentProduct = await tx.query.products.findFirst({ where: eq(productsSchema.id, product.productId) });
                if (!currentProduct) continue;

                const newStock = currentProduct.stock - product.quantity;

                await tx.update(productsSchema).set({ stock: newStock }).where(eq(productsSchema.id, product.productId));

                await tx.insert(stockMovementsSchema).values({
                    id: `sm_${Date.now()}_${product.productId}`,
                    productId: product.productId,
                    referenceId: shipment.id,
                    type: 'Penjualan',
                    quantityChange: -product.quantity,
                    stockBefore: currentProduct.stock,
                    stockAfter: newStock,
                    notes: `Penjualan dari transaksi ${shipment.transactionId}`
                });
            }
            await tx.update(shipmentsSchema).set({ status: 'Terkirim' }).where(eq(shipmentsSchema.id, shipment.id));
        }
     });

     return { count: shipmentsToProcess.length };
}

// =================================
// Settings Functions (Expedition, Packaging, Customer, Supplier, Products)
// =================================
export async function getExpeditions(): Promise<Expedition[]> {
    return await db.select().from(expeditionsSchema);
}
export async function addExpedition(name: string): Promise<Expedition> {
    const newExpedition = { id: `exp_${Date.now()}`, name };
    const result = await db.insert(expeditionsSchema).values(newExpedition).returning();
    return result[0];
}
export async function updateExpedition(id: string, name: string): Promise<Expedition> {
    const result = await db.update(expeditionsSchema).set({ name }).where(eq(expeditionsSchema.id, id)).returning();
    return result[0];
}
export async function deleteExpedition(id: string): Promise<{ id: string }> {
    await db.delete(expeditionsSchema).where(eq(expeditionsSchema.id, id));
    return { id };
}

export async function getPackagingOptions(): Promise<Packaging[]> {
    return await db.select().from(packagingOptionsSchema);
}
export async function addPackagingOption(option: Omit<Packaging, 'id'>): Promise<Packaging> {
    const newOption = { ...option, id: `pkg_${Date.now()}` };
    const result = await db.insert(packagingOptionsSchema).values(newOption).returning();
    return result[0];
}
export async function updatePackagingOption(id: string, option: Omit<Packaging, 'id'>): Promise<Packaging> {
    const result = await db.update(packagingOptionsSchema).set(option).where(eq(packagingOptionsSchema.id, id)).returning();
    return result[0];
}
export async function deletePackagingOption(id: string): Promise<{ id: string }> {
    await db.delete(packagingOptionsSchema).where(eq(packagingOptionsSchema.id, id));
    return { id };
}

export async function getCustomers(): Promise<Customer[]> {
    return await db.select().from(customersSchema);
}
export async function addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const newCustomer = { ...customer, id: `cust_${Date.now()}` };
    const result = await db.insert(customersSchema).values(newCustomer).returning();
    return result[0];
}
export async function updateCustomer(id: string, customer: Omit<Customer, 'id'>): Promise<Customer> {
    const result = await db.update(customersSchema).set(customer).where(eq(customersSchema.id, id)).returning();
    return result[0];
}
export async function deleteCustomer(id: string): Promise<{ id: string }> {
    await db.delete(customersSchema).where(eq(customersSchema.id, id));
    return { id };
}

export async function getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliersSchema);
}
export async function addSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const newSupplier = { ...supplier, id: `sup_${Date.now()}` };
    const result = await db.insert(suppliersSchema).values(newSupplier).returning();
    return result[0];
}
export async function updateSupplier(id: string, supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const result = await db.update(suppliersSchema).set(supplier).where(eq(suppliersSchema.id, id)).returning();
    return result[0];
}
export async function deleteSupplier(id: string): Promise<{ id: string }> {
    await db.delete(suppliersSchema).where(eq(suppliersSchema.id, id));
    return { id };
}


// =================================
// Product Functions
// =================================

export async function getProducts(): Promise<Product[]> {
    return await db.query.products.findMany({
      orderBy: [desc(productsSchema.code)],
    });
}

export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const newProduct = { ...productData, id: `prod_${Date.now()}` };
    
    await db.transaction(async (tx) => {
        await tx.insert(productsSchema).values(newProduct);
        if (newProduct.stock > 0) {
            await tx.insert(stockMovementsSchema).values({
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

    return newProduct;
}

export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const result = await db.update(productsSchema).set(productData).where(eq(productsSchema.id, id)).returning();
    return result[0];
}


export async function deleteMultipleProducts(ids: string[]): Promise<{ ids: string[] }> {
    await db.delete(productsSchema).where(inArray(productsSchema.id, ids));
    return { ids };
}

// =================================
// Stock Functions
// =================================

export async function getStockMovements(productId: string): Promise<StockMovement[]> {
    const results = await db.select().from(stockMovementsSchema).where(eq(stockMovementsSchema.productId, productId)).orderBy(desc(stockMovementsSchema.createdAt));
    return results.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function updateProductStock(productId: string, physicalStock: number, notes: string): Promise<Product> {
    const product = await db.query.products.findFirst({ where: eq(productsSchema.id, productId) });
    if (!product) throw new Error("Produk tidak ditemukan.");

    const stockBefore = product.stock;
    const quantityChange = physicalStock - stockBefore;

    if (quantityChange === 0) return product;

    await db.transaction(async (tx) => {
        await tx.update(productsSchema).set({ stock: physicalStock }).where(eq(productsSchema.id, productId));
        await tx.insert(stockMovementsSchema).values({
            id: `sm_${Date.now()}`,
            productId,
            type: 'Stok Opname',
            quantityChange,
            stockBefore,
            stockAfter: physicalStock,
            notes,
        });
    });

    const updatedProduct = await db.query.products.findFirst({ where: eq(productsSchema.id, productId) });
    return updatedProduct!;
}

export async function bulkUpdateProductStock(updates: { code: string; physicalStock: number; notes: string }[]): Promise<{ success: number; failure: number }> {
    let success = 0;
    let failure = 0;

    await db.transaction(async (tx) => {
        for (const update of updates) {
            const product = await tx.query.products.findFirst({ where: eq(productsSchema.code, update.code) });
            if (!product) {
                failure++;
                continue;
            }

            const stockBefore = product.stock;
            const quantityChange = update.physicalStock - stockBefore;

            if (quantityChange === 0) continue;

            await tx.update(productsSchema).set({ stock: update.physicalStock }).where(eq(productsSchema.id, product.id));
            await tx.insert(stockMovementsSchema).values({
                id: `sm_${Date.now()}_${product.id}`,
                productId: product.id,
                type: 'Stok Opname',
                quantityChange,
                stockBefore,
                stockAfter: update.physicalStock,
                notes: update.notes,
            });
            success++;
        }
    });

    return { success, failure };
}

// =================================
// Financial Functions (Accounts, Transactions)
// =================================

export async function getAccounts(): Promise<Account[]> {
    return await db.query.accounts.findMany({ orderBy: [asc(accountsSchema.name)]});
}
export async function addAccount(account: Omit<Account, 'id' | 'createdAt' | 'balance'> & { balance?: number }): Promise<Account> {
    const { balance, ...accountData } = account;
    const newAccountId = `acc_${Date.now()}`;

    await db.transaction(async (tx) => {
        await tx.insert(accountsSchema).values({ 
            ...accountData,
            id: newAccountId,
            balance: 0,
         });

        if (balance && balance > 0) {
            await tx.insert(financialTransactionsSchema).values({
                id: `ft_${Date.now()}`,
                accountId: newAccountId,
                type: 'in',
                amount: balance,
                category: 'Saldo Awal',
                description: `Saldo awal untuk akun ${accountData.name}`,
                transactionDate: new Date().toISOString().split('T')[0],
            });
            
             await tx.update(accountsSchema)
                .set({ balance: balance })
                .where(eq(accountsSchema.id, newAccountId));
        }
    });

    const newAccount = await db.query.accounts.findFirst({ where: eq(accountsSchema.id, newAccountId) });
    return newAccount!;
}
export async function updateAccount(id: string, account: Partial<Omit<Account, 'id' | 'balance'>>): Promise<Account> {
    const result = await db.update(accountsSchema).set(account).where(eq(accountsSchema.id, id)).returning();
    return result[0];
}
export async function deleteAccount(id: string): Promise<{ id: string }> {
    const hasTransactions = await db.query.financialTransactions.findFirst({ where: eq(financialTransactionsSchema.accountId, id) });
    if (hasTransactions) {
        throw new Error("Tidak bisa menghapus akun yang sudah memiliki transaksi.");
    }
    await db.delete(accountsSchema).where(eq(accountsSchema.id, id));
    return { id };
}


export async function getFinancialTransactions(accountId?: string, startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
     let whereClauses = [];
    if (accountId) whereClauses.push(eq(financialTransactionsSchema.accountId, accountId));
    if (startDate) whereClauses.push(gte(financialTransactionsSchema.transactionDate, startDate));
    if (endDate) whereClauses.push(lte(financialTransactionsSchema.transactionDate, endDate));

    const transactions = await db.query.financialTransactions.findMany({
      where: and(...whereClauses),
      with: {
        account: {
          columns: {
            name: true,
          }
        }
      },
      orderBy: [desc(financialTransactionsSchema.transactionDate), desc(financialTransactionsSchema.createdAt)],
    });
    return transactions.map(t => ({...t, transactionDate: t.transactionDate.toString()}));
}

export async function addFinancialTransaction(transaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>): Promise<FinancialTransaction> {
     const newId = `ft_${Date.now()}`;
     await db.transaction(async (tx) => {
        await tx.insert(financialTransactionsSchema).values({ ...transaction, id: newId });

        const amount = transaction.type === 'in' ? transaction.amount : -transaction.amount;
        await tx.update(accountsSchema)
          .set({ balance: sql`${accountsSchema.balance} + ${amount}` })
          .where(eq(accountsSchema.id, transaction.accountId));
    });

    const newTx = await db.query.financialTransactions.findFirst({
        where: eq(financialTransactionsSchema.id, newId),
        with: { account: { columns: { name: true } } },
    });
    return { ...newTx!, transactionDate: newTx!.transactionDate.toString() };
}

export async function updateFinancialTransaction(id: string, transaction: Partial<Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>>): Promise<FinancialTransaction> {
    const originalTx = await db.query.financialTransactions.findFirst({ where: eq(financialTransactionsSchema.id, id) });
    if (!originalTx) throw new Error("Transaksi tidak ditemukan");

    await db.transaction(async (tx) => {
        // Revert original transaction effect on balance
        const originalAmount = originalTx.type === 'in' ? -originalTx.amount : originalTx.amount;
        await tx.update(accountsSchema)
            .set({ balance: sql`${accountsSchema.balance} + ${originalAmount}`})
            .where(eq(accountsSchema.id, originalTx.accountId));
        
        // Update the transaction
        await tx.update(financialTransactionsSchema).set(transaction).where(eq(financialTransactionsSchema.id, id));

        // Apply new transaction effect on balance
        const updatedTx = { ...originalTx, ...transaction };
        const newAmount = updatedTx.type === 'in' ? updatedTx.amount : -updatedTx.amount;
        await tx.update(accountsSchema)
            .set({ balance: sql`${accountsSchema.balance} + ${newAmount}`})
            .where(eq(accountsSchema.id, updatedTx.accountId));
    });
    
    const result = await db.query.financialTransactions.findFirst({ where: eq(financialTransactionsSchema.id, id), with: { account: { columns: { name: true } } }});
    return { ...result!, transactionDate: result!.transactionDate.toString() };
}

export async function deleteFinancialTransaction(id: string): Promise<{ id: string }> {
     const originalTx = await db.query.financialTransactions.findFirst({ where: eq(financialTransactionsSchema.id, id) });
    if (!originalTx) throw new Error("Transaksi tidak ditemukan");

    await db.transaction(async (tx) => {
        // Revert transaction effect on balance
        const amountToRevert = originalTx.type === 'in' ? -originalTx.amount : originalTx.amount;
        await tx.update(accountsSchema)
            .set({ balance: sql`${accountsSchema.balance} + ${amountToRevert}`})
            .where(eq(accountsSchema.id, originalTx.accountId));
        
        // Delete transaction
        await tx.delete(financialTransactionsSchema).where(eq(financialTransactionsSchema.id, id));
    });
    return { id };
}

export async function addInternalTransfer(transfer: Transfer): Promise<any> {
     await db.transaction(async (tx) => {
        const transferId = `tf_${Date.now()}`;
        // Create withdrawal transaction
        await tx.insert(financialTransactionsSchema).values({
            id: `ft_out_${Date.now()}`,
            accountId: transfer.fromAccountId,
            type: 'out',
            amount: transfer.amount,
            category: 'Transfer Keluar',
            description: `Transfer ke ${transfer.toAccountId}: ${transfer.description}`,
            transactionDate: transfer.transferDate.toISOString().split('T')[0],
            referenceId: transferId,
        });

        // Create deposit transaction
        await tx.insert(financialTransactionsSchema).values({
            id: `ft_in_${Date.now()}`,
            accountId: transfer.toAccountId,
            type: 'in',
            amount: transfer.amount,
            category: 'Transfer Masuk',
            description: `Transfer dari ${transfer.fromAccountId}: ${transfer.description}`,
            transactionDate: transfer.transferDate.toISOString().split('T')[0],
            referenceId: transferId,
        });

        // Update balances
        await tx.update(accountsSchema)
            .set({ balance: sql`${accountsSchema.balance} - ${transfer.amount}`})
            .where(eq(accountsSchema.id, transfer.fromAccountId));
        
        await tx.update(accountsSchema)
            .set({ balance: sql`${accountsSchema.balance} + ${transfer.amount}`})
            .where(eq(accountsSchema.id, transfer.toAccountId));
    });
    return { message: "Transfer successful" };
}

// =================================
// Sales & Purchase Functions
// =================================

export async function processDirectSale(user: User, customerId: string, cart: any[], accountId: string, paymentStatus: 'Lunas' | 'Belum Lunas') {
    const customer = await db.query.customers.findFirst({ where: eq(customersSchema.id, customerId) });
    if (!customer) throw new Error("Customer not found");

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCostPrice = cart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);

    const newShipmentId = `ship_${Date.now()}`;

    await db.transaction(async (tx) => {
         // 1. Create shipment record
        const shipmentResult = await tx.insert(shipmentsSchema).values({
            id: newShipmentId,
            userId: user.id,
            transactionId: `SALE-${Date.now()}`,
            customerId: customerId,
            customerName: customer.name,
            expedition: 'Penjualan Langsung',
            accountId: accountId,
            status: 'Terkirim',
            paymentStatus: paymentStatus,
            products: cart,
            totalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
            totalProductCost: totalCostPrice,
            totalPackingCost: 0,
            totalAmount: totalAmount,
            totalRevenue: totalAmount - totalCostPrice, // Simplified profit
            createdAt: new Date(),
            paidAt: paymentStatus === 'Lunas' ? new Date() : null,
        }).returning();

        // 2. Create stock movements and update stock
        for (const item of cart) {
            const product = await tx.query.products.findFirst({ where: eq(productsSchema.id, item.productId) });
            if (!product) throw new Error(`Product ${item.name} not found`);

            const newStock = product.stock - item.quantity;
            await tx.update(productsSchema).set({ stock: newStock }).where(eq(productsSchema.id, item.productId));

            await tx.insert(stockMovementsSchema).values({
                id: `sm_${Date.now()}_${item.productId}`,
                productId: item.productId,
                referenceId: newShipmentId,
                type: 'Penjualan',
                quantityChange: -item.quantity,
                stockBefore: product.stock,
                stockAfter: newStock,
                notes: `Penjualan Langsung ${shipmentResult[0].transactionId}`,
            });
        }
        
        // 3. Create financial transaction if paid
        if (paymentStatus === 'Lunas') {
            await tx.insert(financialTransactionsSchema).values({
                id: `ft_${Date.now()}`,
                accountId: accountId,
                type: 'in',
                amount: totalAmount,
                category: 'Penjualan Tunai',
                description: `Penjualan Langsung ${shipmentResult[0].transactionId}`,
                transactionDate: new Date().toISOString().split('T')[0],
                referenceId: newShipmentId,
            });
            await tx.update(accountsSchema)
                .set({ balance: sql`${accountsSchema.balance} + ${totalAmount}`})
                .where(eq(accountsSchema.id, accountId));
        }
    });

    const finalShipment = await db.query.shipments.findFirst({ where: eq(shipmentsSchema.id, newShipmentId) });
    return finalShipment!;
}

export async function getPurchases(): Promise<Purchase[]> {
    const results = await db.query.purchases.findMany({
        orderBy: [desc(purchasesSchema.createdAt)],
    });
    return results.map(p => ({
        ...p,
        products: typeof p.products === 'string' ? JSON.parse(p.products) : p.products,
    }));
}

export async function addPurchase(purchase: any): Promise<Purchase> {
    const newId = `purch_${Date.now()}`;
    const totalAmount = purchase.products.reduce((sum: number, p: any) => sum + (p.costPrice * p.quantity), 0);

    await db.transaction(async (tx) => {
        await tx.insert(purchasesSchema).values({
            id: newId,
            supplierId: purchase.supplierId,
            supplierName: purchase.supplierName,
            purchaseNumber: purchase.purchaseNumber,
            accountId: purchase.accountId || null,
            status: 'Selesai',
            paymentStatus: purchase.paymentStatus,
            products: purchase.products,
            totalAmount,
            createdAt: new Date(),
            paidAt: purchase.paymentStatus === 'Lunas' ? new Date() : null,
        });

        for (const item of purchase.products) {
            const product = await tx.query.products.findFirst({ where: eq(productsSchema.id, item.productId) });
            if (!product) throw new Error(`Product not found: ${item.name}`);
            const newStock = product.stock + item.quantity;

            await tx.update(productsSchema).set({ stock: newStock }).where(eq(productsSchema.id, item.productId));
            await tx.insert(stockMovementsSchema).values({
                id: `sm_${Date.now()}_${item.productId}`,
                productId: item.productId,
                referenceId: newId,
                type: 'Pembelian',
                quantityChange: item.quantity,
                stockBefore: product.stock,
                stockAfter: newStock,
                notes: `Pembelian dari ${purchase.supplierName} (${purchase.purchaseNumber})`,
            });
        }
        
        if (purchase.paymentStatus === 'Lunas' && purchase.accountId) {
            await tx.insert(financialTransactionsSchema).values({
                id: `ft_${Date.now()}`,
                accountId: purchase.accountId,
                type: 'out',
                amount: totalAmount,
                category: 'Pembelian Stok',
                description: `Pembelian dari ${purchase.supplierName} (${purchase.purchaseNumber})`,
                transactionDate: new Date().toISOString().split('T')[0],
                referenceId: newId,
            });
             await tx.update(accountsSchema)
                .set({ balance: sql`${accountsSchema.balance} - ${totalAmount}`})
                .where(eq(accountsSchema.id, purchase.accountId));
        }
    });

    const result = await db.query.purchases.findFirst({ where: eq(purchasesSchema.id, newId) });
    return { ...result!, products: typeof result!.products === 'string' ? JSON.parse(result!.products) : result!.products };
}

export async function getReturns(): Promise<Return[]> {
    const results = await db.query.returns.findMany({ orderBy: [desc(returnsSchema.createdAt)] });
    return results.map(r => ({
        ...r,
        products: typeof r.products === 'string' ? JSON.parse(r.products) : r.products,
    }));
}

export async function addReturn(retur: any): Promise<Return> {
    const newId = `ret_${Date.now()}`;
    const originalShipment = await db.query.shipments.findFirst({ where: eq(shipmentsSchema.id, retur.originalShipmentId) });
    if (!originalShipment) throw new Error("Transaksi penjualan asli tidak ditemukan.");
    
    const totalAmount = retur.products.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);

    await db.transaction(async (tx) => {
        await tx.insert(returnsSchema).values({
            id: newId,
            originalShipmentId: retur.originalShipmentId,
            originalTransactionId: originalShipment.transactionId,
            customerName: originalShipment.customerName,
            products: retur.products,
            reason: retur.reason,
            totalAmount,
            createdAt: new Date(),
        });

        for (const item of retur.products) {
            const product = await tx.query.products.findFirst({ where: eq(productsSchema.id, item.productId) });
            if (!product) throw new Error(`Product not found: ${item.name}`);
            const newStock = product.stock + item.quantity;

            await tx.update(productsSchema).set({ stock: newStock }).where(eq(productsSchema.id, item.productId));
            await tx.insert(stockMovementsSchema).values({
                id: `sm_${Date.now()}_${item.productId}`,
                productId: item.productId,
                referenceId: newId,
                type: 'Retur',
                quantityChange: item.quantity,
                stockBefore: product.stock,
                stockAfter: newStock,
                notes: `Retur dari transaksi ${originalShipment.transactionId}`,
            });
        }

        // Create a financial transaction to refund the customer, assuming cash refund
        await tx.insert(financialTransactionsSchema).values({
            id: `ft_${Date.now()}`,
            accountId: originalShipment.accountId, // Refund to the original payment account
            type: 'out',
            amount: totalAmount,
            category: 'Retur Penjualan',
            description: `Retur dari transaksi ${originalShipment.transactionId}`,
            transactionDate: new Date().toISOString().split('T')[0],
            referenceId: newId,
        });
        await tx.update(accountsSchema)
            .set({ balance: sql`${accountsSchema.balance} - ${totalAmount}`})
            .where(eq(accountsSchema.id, originalShipment.accountId));
    });

    const result = await db.query.returns.findFirst({ where: eq(returnsSchema.id, newId) });
    return { ...result!, products: typeof result!.products === 'string' ? JSON.parse(result!.products) : result!.products };
}

// =================================
// Payables & Receivables Functions
// =================================

export async function payPayable(purchaseId: string, accountId: string, paidAt: Date): Promise<Purchase> {
    const purchase = await db.query.purchases.findFirst({ where: eq(purchasesSchema.id, purchaseId) });
    if (!purchase || purchase.paymentStatus === 'Lunas') throw new Error("Pembelian tidak ditemukan atau sudah lunas.");

    await db.transaction(async (tx) => {
        await tx.update(purchasesSchema)
            .set({ paymentStatus: 'Lunas', paidAt: paidAt, accountId: accountId })
            .where(eq(purchasesSchema.id, purchaseId));
        
        await tx.insert(financialTransactionsSchema).values({
            id: `ft_${Date.now()}`,
            accountId: accountId,
            type: 'out',
            amount: purchase.totalAmount,
            category: 'Pembayaran Utang',
            description: `Pembayaran untuk pembelian ${purchase.purchaseNumber}`,
            transactionDate: paidAt.toISOString().split('T')[0],
            referenceId: purchaseId,
        });

        await tx.update(accountsSchema)
            .set({ balance: sql`${accountsSchema.balance} - ${purchase.totalAmount}`})
            .where(eq(accountsSchema.id, accountId));
    });

    const updatedPurchase = await db.query.purchases.findFirst({ where: eq(purchasesSchema.id, purchaseId) });
    return { ...updatedPurchase!, products: typeof updatedPurchase!.products === 'string' ? JSON.parse(updatedPurchase!.products) : updatedPurchase!.products };
}

export async function payReceivable(shipmentId: string, accountId: string, paidAt: Date): Promise<Shipment> {
    const shipment = await db.query.shipments.findFirst({ where: eq(shipmentsSchema.id, shipmentId) });
    if (!shipment || shipment.paymentStatus === 'Lunas') throw new Error("Transaksi tidak ditemukan atau sudah lunas.");

    await db.transaction(async (tx) => {
        await tx.update(shipmentsSchema)
            .set({ paymentStatus: 'Lunas', paidAt: paidAt, accountId: accountId })
            .where(eq(shipmentsSchema.id, shipmentId));
        
        await tx.insert(financialTransactionsSchema).values({
            id: `ft_${Date.now()}`,
            accountId: accountId,
            type: 'in',
            amount: shipment.totalAmount,
            category: 'Penerimaan Piutang',
            description: `Penerimaan pembayaran untuk transaksi ${shipment.transactionId}`,
            transactionDate: paidAt.toISOString().split('T')[0],
            referenceId: shipmentId,
        });
        
         await tx.update(accountsSchema)
            .set({ balance: sql`${accountsSchema.balance} + ${shipment.totalAmount}`})
            .where(eq(accountsSchema.id, accountId));
    });
    
    const updatedShipment = await db.query.shipments.findFirst({ where: eq(shipmentsSchema.id, shipmentId) });
    return { ...updatedShipment!, products: typeof updatedShipment!.products === 'string' ? JSON.parse(updatedShipment!.products) : updatedShipment!.products, receipt: typeof updatedShipment!.receipt === 'string' ? JSON.parse(updatedShipment!.receipt) : updatedShipment!.receipt };
}

// =================================
// Report Functions
// =================================

export async function getSalesProfitReport(startDate: Date, endDate: Date, userId: string): Promise<SalesProfitReportData> {
    const userFilter = userId === 'all' ? sql`1=1` : eq(shipmentsSchema.userId, userId);

    const deliveredShipments = await db.select().from(shipmentsSchema).where(
        and(
            eq(shipmentsSchema.status, 'Terkirim'),
            gte(shipmentsSchema.createdAt, startDate),
            lte(shipmentsSchema.createdAt, endDate),
            userFilter
        )
    );
    
    const allUsers = await db.select({ id: usersSchema.id, username: usersSchema.username }).from(usersSchema);
    const userMap = new Map(allUsers.map(u => [u.id, u.username]));
    
    let totalRevenue = 0;
    let totalCOGS = 0;
    
    const transactionDetails = deliveredShipments.map(s => {
        const products = typeof s.products === 'string' ? JSON.parse(s.products) : s.products;
        const cogs = products.reduce((sum: number, p: any) => sum + (p.costPrice * p.quantity), 0);
        totalRevenue += s.totalAmount;
        totalCOGS += cogs;
        return {
            id: s.id,
            transactionId: s.transactionId,
            createdAt: s.createdAt.toISOString(),
            customerName: s.customerName,
            userId: s.userId,
            userName: userMap.get(s.userId) || 'N/A',
            totalRevenue: s.totalAmount,
            totalCOGS: cogs,
            profit: s.totalAmount - cogs,
        };
    });

    const expenses = await db.select({ amount: financialTransactionsSchema.amount }).from(financialTransactionsSchema).where(
        and(
            eq(financialTransactionsSchema.type, 'out'),
            eq(financialTransactionsSchema.category, 'Biaya Operasional'),
            gte(financialTransactionsSchema.transactionDate, startDate.toISOString().split('T')[0]),
            lte(financialTransactionsSchema.transactionDate, endDate.toISOString().split('T')[0])
        )
    );
    
    const operationalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - operationalExpenses;

    return {
        totalRevenue,
        totalCOGS,
        grossProfit,
        operationalExpenses,
        netProfit,
        transactionDetails,
    };
}
