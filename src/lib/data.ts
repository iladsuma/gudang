
import type { 
    Shipment, 
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
    StockMovement,
    Notification
} from './types';
import initialData from '../../db.json';
import { sendNewOrderNotification, sendOrderFinishedNotification, sendAdminOrderAlert } from './whatsapp';

const DB_KEY = 'boutique_local_db_v1';

function getDB() {
    if (typeof window === 'undefined') return initialData;
    const stored = localStorage.getItem(DB_KEY);
    if (!stored) {
        localStorage.setItem(DB_KEY, JSON.stringify(initialData));
        return initialData;
    }
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error("Gagal parse database lokal, mereset...", e);
        return initialData;
    }
}

function saveDB(data: any) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    }
}

export async function getUsers(): Promise<User[]> {
    const db = getDB();
    return db.users || [];
}

export async function addUser(user: Omit<User, 'id'>): Promise<User> {
    const db = getDB();
    const newUser: User = { ...user, id: `usr_${Date.now()}` };
    db.users.push(newUser);
    saveDB(db);
    return newUser;
}

export async function updateUser(id: string, user: Partial<User>): Promise<User> {
    const db = getDB();
    const index = db.users.findIndex((u: any) => u.id === id);
    if (index === -1) throw new Error("User tidak ditemukan");
    db.users[index] = { ...db.users[index], ...user };
    saveDB(db);
    return db.users[index];
}

export async function deleteUser(id: string): Promise<{ id: string }> {
    const db = getDB();
    db.users = db.users.filter((u: any) => u.id !== id);
    saveDB(db);
    return { id };
}

export async function getShipments(): Promise<Shipment[]> {
    const db = getDB();
    return db.shipments || [];
}

export async function addShipment(shipment: Omit<Shipment, 'id' | 'createdAt' | 'status'>): Promise<Shipment> {
    const db = getDB();
    const newShipment: Shipment = {
        ...shipment,
        id: `ship_${Date.now()}`,
        status: 'Proses',
        createdAt: new Date().toISOString(),
    };
    
    db.shipments.unshift(newShipment);

    if (shipment.products) {
        for (const p of shipment.products) {
            const product = db.products.find((prod: any) => prod.id === p.productId);
            if (product) {
                const stockBefore = product.stock;
                product.stock -= p.quantity;
                db.stockMovements.push({
                    id: `sm_${Date.now()}_${p.productId}`,
                    productId: p.productId,
                    referenceId: newShipment.id,
                    type: 'Penjualan',
                    quantityChange: -p.quantity,
                    stockBefore,
                    stockAfter: product.stock,
                    notes: `Pesanan ${newShipment.transactionId}`,
                    createdAt: new Date().toISOString(),
                });
            }
        }
    }

    if (shipment.downPayment && shipment.downPayment > 0 && shipment.accountId) {
        const account = db.accounts.find((a: any) => a.id === shipment.accountId);
        if (account) {
            account.balance += shipment.downPayment;
            db.financialTransactions.push({
                id: `ft_${Date.now()}`,
                accountId: shipment.accountId,
                type: 'in',
                amount: shipment.downPayment,
                category: 'Uang Muka',
                description: `DP Pesanan ${newShipment.transactionId} (${newShipment.customerName})`,
                transactionDate: new Date().toISOString().split('T')[0],
                referenceId: newShipment.id,
                createdAt: new Date().toISOString(),
            });
        }
    }

    saveDB(db);

    // NOTIFIKASI WHATSAPP
    const customer = db.customers.find((c: any) => c.id === shipment.customerId);
    if (customer) {
        // Jalankan notifikasi tanpa menghambat UI (background fire and forget)
        if (customer.phone) {
            sendNewOrderNotification(newShipment, customer).catch(err => console.error("Gagal kirim WA Pelanggan:", err));
        }
        sendAdminOrderAlert(newShipment, customer).catch(err => console.error("Gagal kirim WA Admin:", err));
    }

    return newShipment;
}

export async function updateShipment(id: string, shipment: Partial<Shipment>): Promise<Shipment> {
    const db = getDB();
    const index = db.shipments.findIndex((s: any) => s.id === id);
    if (index === -1) throw new Error("Pesanan tidak ditemukan");
    db.shipments[index] = { ...db.shipments[index], ...shipment };
    saveDB(db);
    return db.shipments[index];
}

export async function deleteShipment(id: string): Promise<{ id: string }> {
    const db = getDB();
    db.shipments = db.shipments.filter((s: any) => s.id !== id);
    saveDB(db);
    return { id };
}

export async function processShipmentsToPackaging(shipmentIds: string[], user: User | null): Promise<{ count: number }> {
    const db = getDB();
    let count = 0;
    db.shipments.forEach((s: any) => {
        if (shipmentIds.includes(s.id)) {
            s.status = 'Pengemasan';
            if (user) s.userId = user.id;
            count++;
        }
    });
    saveDB(db);
    return { count };
}

export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<{ count: number }> {
    const db = getDB();
    let count = 0;
    
    for (const s of db.shipments) {
        if (shipmentIds.includes(s.id)) {
            s.status = 'Terkirim';
            count++;

            const customer = db.customers.find((c: any) => c.id === s.customerId);
            if (customer && customer.phone) {
                sendOrderFinishedNotification(s, customer).catch(err => console.error("Gagal kirim WA Selesai:", err));
            }
        }
    }
    
    saveDB(db);
    return { count };
}

export async function getCustomers(): Promise<Customer[]> {
    const db = getDB();
    return db.customers || [];
}
export async function addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const db = getDB();
    const newCust = { ...customer, id: `cust_${Date.now()}` };
    db.customers.push(newCust);
    saveDB(db);
    return newCust;
}
export async function updateCustomer(id: string, customer: Omit<Customer, 'id'>): Promise<Customer> {
    const db = getDB();
    const idx = db.customers.findIndex((c: any) => c.id === id);
    if (idx !== -1) db.customers[idx] = { ...customer, id };
    saveDB(db);
    return db.customers[idx];
}
export async function deleteCustomer(id: string): Promise<{ id: string }> {
    const db = getDB();
    db.customers = db.customers.filter((c: any) => c.id !== id);
    saveDB(db);
    return { id };
}

export async function getSuppliers(): Promise<Supplier[]> {
    const db = getDB();
    return db.suppliers || [];
}
export async function addSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const db = getDB();
    const newSup = { ...supplier, id: `sup_${Date.now()}` };
    db.suppliers.push(newSup);
    saveDB(db);
    return newSup;
}
export async function updateSupplier(id: string, supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const db = getDB();
    const idx = db.suppliers.findIndex((s: any) => s.id === id);
    if (idx !== -1) db.suppliers[idx] = { ...supplier, id };
    saveDB(db);
    return db.suppliers[idx];
}
export async function deleteSupplier(id: string): Promise<{ id: string }> {
    const db = getDB();
    db.suppliers = db.suppliers.filter((s: any) => s.id !== id);
    saveDB(db);
    return { id };
}

export async function getProducts(): Promise<Product[]> {
    const db = getDB();
    return db.products || [];
}

export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const db = getDB();
    const newProd = { ...productData, id: `prod_${Date.now()}` };
    db.products.push(newProd);
    
    if (newProd.stock > 0) {
        db.stockMovements.push({
            id: `sm_${Date.now()}`,
            productId: newProd.id,
            type: 'Stok Awal',
            quantityChange: newProd.stock,
            stockBefore: 0,
            stockAfter: newProd.stock,
            notes: 'Stok awal produk',
            createdAt: new Date().toISOString(),
        });
    }
    
    saveDB(db);
    return newProd;
}

export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const db = getDB();
    const idx = db.products.findIndex((p: any) => p.id === id);
    if (idx !== -1) db.products[idx] = { ...db.products[idx], ...productData };
    saveDB(db);
    return db.products[idx];
}

export async function deleteMultipleProducts(ids: string[]): Promise<{ ids: string[] }> {
    const db = getDB();
    db.products = db.products.filter((p: any) => !ids.includes(p.id));
    saveDB(db);
    return { ids };
}

export async function getStockMovements(productId: string): Promise<StockMovement[]> {
    const db = getDB();
    return (db.stockMovements || []).filter((m: any) => m.productId === productId).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateProductStock(productId: string, physicalStock: number, notes: string): Promise<Product> {
    const db = getDB();
    const product = db.products.find((p: any) => p.id === productId);
    if (!product) throw new Error("Produk tidak ditemukan");
    
    const stockBefore = product.stock;
    const diff = physicalStock - stockBefore;
    
    if (diff !== 0) {
        product.stock = physicalStock;
        db.stockMovements.push({
            id: `sm_${Date.now()}`,
            productId,
            type: 'Stok Opname',
            quantityChange: diff,
            stockBefore,
            stockAfter: physicalStock,
            notes,
            createdAt: new Date().toISOString(),
        });
    }
    
    saveDB(db);
    return product;
}

export async function getAccounts(): Promise<Account[]> {
    const db = getDB();
    return db.accounts || [];
}

export async function addAccount(account: Omit<Account, 'id' | 'createdAt' | 'balance'> & { balance?: number }): Promise<Account> {
    const db = getDB();
    const initialBalance = account.balance || 0;
    const newAcc: Account = { 
        ...account, 
        id: `acc_${Date.now()}`, 
        balance: initialBalance,
        createdAt: new Date().toISOString() 
    };
    db.accounts.push(newAcc);
    
    if (initialBalance > 0) {
        db.financialTransactions.push({
            id: `ft_${Date.now()}`,
            accountId: newAcc.id,
            type: 'in',
            amount: initialBalance,
            category: 'Saldo Awal',
            description: `Saldo awal akun ${newAcc.name}`,
            transactionDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
        });
    }
    
    saveDB(db);
    return newAcc;
}

export async function updateAccount(id: string, account: Partial<Omit<Account, 'id' | 'balance'>>): Promise<Account> {
    const db = getDB();
    const idx = db.accounts.findIndex((a: any) => a.id === id);
    if (idx !== -1) db.accounts[idx] = { ...db.accounts[idx], ...account };
    saveDB(db);
    return db.accounts[idx];
}

export async function deleteAccount(id: string): Promise<{ id: string }> {
    const db = getDB();
    db.accounts = db.accounts.filter((a: any) => a.id !== id);
    saveDB(db);
    return { id };
}

export async function getFinancialTransactions(accountId?: string, startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    const db = getDB();
    let txs = db.financialTransactions || [];
    
    if (accountId) txs = txs.filter((t: any) => t.accountId === accountId);
    if (startDate) txs = txs.filter((t: any) => t.transactionDate >= startDate);
    if (endDate) txs = txs.filter((t: any) => t.transactionDate <= endDate);
    
    const result = txs.map((t: any) => ({
        ...t,
        account: { name: db.accounts.find((a: any) => a.id === t.accountId)?.name || 'N/A' }
    }));
    
    return result.sort((a: any, b: any) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
}

export async function addFinancialTransaction(transaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>): Promise<FinancialTransaction> {
    const db = getDB();
    const newTx: FinancialTransaction = {
        ...transaction,
        id: `ft_${Date.now()}`,
        createdAt: new Date().toISOString(),
        account: { name: db.accounts.find((a: any) => a.id === transaction.accountId)?.name || 'N/A' }
    };
    
    db.financialTransactions.push(newTx);
    
    const account = db.accounts.find((a: any) => a.id === transaction.accountId);
    if (account) {
        account.balance += (transaction.type === 'in' ? transaction.amount : -transaction.amount);
    }
    
    saveDB(db);
    return newTx;
}

export async function updateFinancialTransaction(id: string, transaction: Partial<Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>>): Promise<FinancialTransaction> {
    const db = getDB();
    const idx = db.financialTransactions.findIndex((t: any) => t.id === id);
    if (idx !== -1) {
        const oldTx = db.financialTransactions[idx];
        const oldAccount = db.accounts.find((a: any) => a.id === oldTx.accountId);
        if (oldAccount) oldAccount.balance -= (oldTx.type === 'in' ? oldTx.amount : -oldTx.amount);
        
        db.financialTransactions[idx] = { ...oldTx, ...transaction };
        const newTx = db.financialTransactions[idx];
        const newAccount = db.accounts.find((a: any) => a.id === newTx.accountId);
        if (newAccount) newAccount.balance += (newTx.type === 'in' ? newTx.amount : -newTx.amount);
    }
    saveDB(db);
    return db.financialTransactions[idx];
}

export async function deleteFinancialTransaction(id: string): Promise<{ id: string }> {
    const db = getDB();
    const tx = db.financialTransactions.find((t: any) => t.id === id);
    if (tx) {
        const account = db.accounts.find((a: any) => a.id === tx.accountId);
        if (account) account.balance -= (tx.type === 'in' ? tx.amount : -tx.amount);
        db.financialTransactions = db.financialTransactions.filter((t: any) => t.id !== id);
    }
    saveDB(db);
    return { id };
}

export async function addInternalTransfer(transfer: Transfer): Promise<any> {
    const db = getDB();
    const fromAcc = db.accounts.find((a: any) => a.id === transfer.fromAccountId);
    const toAcc = db.accounts.find((a: any) => a.id === transfer.toAccountId);
    
    if (fromAcc && toAcc) {
        fromAcc.balance -= transfer.amount;
        toAcc.balance += transfer.amount;
        
        const dateStr = transfer.transferDate.toISOString().split('T')[0];
        
        db.financialTransactions.push({
            id: `ft_out_${Date.now()}`,
            accountId: fromAcc.id,
            type: 'out',
            amount: transfer.amount,
            category: 'Transfer Keluar',
            description: `${transfer.description} (Ke ${toAcc.name})`,
            transactionDate: dateStr,
            createdAt: new Date().toISOString(),
        });
        
        db.financialTransactions.push({
            id: `ft_in_${Date.now()}`,
            accountId: toAcc.id,
            type: 'in',
            amount: transfer.amount,
            category: 'Transfer Masuk',
            description: `${transfer.description} (Dari ${fromAcc.name})`,
            transactionDate: dateStr,
            createdAt: new Date().toISOString(),
        });
    }
    
    saveDB(db);
    return { success: true };
}

export async function processDirectSale(user: User, customerId: string, cart: any[], accountId: string, paymentStatus: 'Lunas' | 'Belum Lunas'): Promise<Shipment> {
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const customer = (await getCustomers()).find(c => c.id === customerId);
    
    return addShipment({
        userId: user.id,
        transactionId: `S-${Date.now()}`,
        customerId,
        customerName: customer?.name || 'Pelanggan Umum',
        accountId,
        products: cart,
        totalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
        totalProductCost: totalAmount,
        totalAmount,
        totalRevenue: totalAmount,
        paymentStatus,
        downPayment: paymentStatus === 'Lunas' ? totalAmount : 0,
    });
}

export async function getPurchases(): Promise<Purchase[]> {
    const db = getDB();
    return db.purchases || [];
}

export async function addPurchase(purchase: any): Promise<Purchase> {
    const db = getDB();
    const newPurchase: Purchase = {
        ...purchase,
        id: `purch_${Date.now()}`,
        status: 'Selesai',
        createdAt: new Date().toISOString(),
    };
    
    db.purchases.unshift(newPurchase);
    
    for (const p of newPurchase.products) {
        const product = db.products.find((prod: any) => prod.id === p.productId);
        if (product) {
            const stockBefore = product.stock;
            product.stock += p.quantity;
            db.stockMovements.push({
                id: `sm_in_${Date.now()}_${product.id}`,
                productId: product.id,
                type: 'Pembelian',
                quantityChange: p.quantity,
                stockBefore,
                stockAfter: product.stock,
                notes: `Pembelian ${newPurchase.purchaseNumber}`,
                createdAt: new Date().toISOString(),
            });
        }
    }
    
    if (newPurchase.paymentStatus === 'Lunas' && newPurchase.accountId) {
        const account = db.accounts.find((a: any) => a.id === newPurchase.accountId);
        if (account) {
            account.balance -= newPurchase.totalAmount;
            db.financialTransactions.push({
                id: `ft_p_${Date.now()}`,
                accountId: newPurchase.accountId,
                type: 'out',
                amount: newPurchase.totalAmount,
                category: 'Pembelian Stok',
                description: `Pembelian ${newPurchase.purchaseNumber} (${newPurchase.supplierName})`,
                transactionDate: new Date().toISOString().split('T')[0],
                referenceId: newPurchase.id,
                createdAt: new Date().toISOString(),
            });
        }
    }
    
    saveDB(db);
    return newPurchase;
}

export async function getReturns(): Promise<Return[]> {
    const db = getDB();
    return db.returns || [];
}

export async function addReturn(retur: any): Promise<Return> {
    const db = getDB();
    const shipment = db.shipments.find((s: any) => s.id === retur.originalShipmentId);
    
    const newReturn: Return = {
        ...retur,
        id: `ret_${Date.now()}`,
        originalTransactionId: shipment?.transactionId || 'N/A',
        customerName: shipment?.customerName || 'N/A',
        totalAmount: retur.products.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0),
        createdAt: new Date().toISOString(),
    };
    
    db.returns.unshift(newReturn);
    
    for (const p of newReturn.products) {
        const product = db.products.find((prod: any) => prod.id === p.productId);
        if (product) {
            const stockBefore = product.stock;
            product.stock += p.quantity;
            db.stockMovements.push({
                id: `sm_ret_${Date.now()}_${product.id}`,
                productId: product.id,
                type: 'Retur',
                quantityChange: p.quantity,
                stockBefore,
                stockAfter: product.stock,
                notes: `Retur dari ${newReturn.originalTransactionId}`,
                createdAt: new Date().toISOString(),
            });
        }
    }
    
    saveDB(db);
    return newReturn;
}

export async function payPayable(purchaseId: string, accountId: string, paidAt: Date): Promise<Purchase> {
    const db = getDB();
    const purchase = db.purchases.find((p: any) => p.id === purchaseId);
    const account = db.accounts.find((a: any) => a.id === accountId);
    
    if (purchase && account) {
        purchase.paymentStatus = 'Lunas';
        purchase.paidAt = paidAt.toISOString();
        purchase.accountId = accountId;
        account.balance -= purchase.totalAmount;
        
        db.financialTransactions.push({
            id: `ft_pay_${Date.now()}`,
            accountId,
            type: 'out',
            amount: purchase.totalAmount,
            category: 'Pelunasan Hutang',
            description: `Bayar hutang ${purchase.purchaseNumber} (${purchase.supplierName})`,
            transactionDate: paidAt.toISOString().split('T')[0],
            referenceId: purchase.id,
            createdAt: new Date().toISOString(),
        });
    }
    
    saveDB(db);
    return purchase;
}

export async function payReceivable(shipmentId: string, accountId: string, paidAt: Date): Promise<Shipment> {
    const db = getDB();
    const shipment = db.shipments.find((s: any) => s.id === shipmentId);
    const account = db.accounts.find((a: any) => a.id === accountId);
    
    if (shipment && account) {
        const remaining = shipment.totalAmount - (shipment.downPayment || 0);
        shipment.paymentStatus = 'Lunas';
        shipment.paidAt = paidAt.toISOString();
        account.balance += remaining;
        
        db.financialTransactions.push({
            id: `ft_rec_${Date.now()}`,
            accountId,
            type: 'in',
            amount: remaining,
            category: 'Pelunasan Piutang',
            description: `Terima piutang ${shipment.transactionId} (${shipment.customerName})`,
            transactionDate: paidAt.toISOString().split('T')[0],
            referenceId: shipment.id,
            createdAt: new Date().toISOString(),
        });
    }
    
    saveDB(db);
    return shipment;
}

export async function getSalesProfitReport(startDate: Date, endDate: Date, userId: string): Promise<SalesProfitReportData> {
    const db = getDB();
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    let deliveredShipments = db.shipments.filter((s: any) => 
        s.status === 'Terkirim' && 
        s.createdAt.split('T')[0] >= startStr && 
        s.createdAt.split('T')[0] <= endStr
    );
    
    if (userId !== 'all') {
        deliveredShipments = deliveredShipments.filter((s: any) => s.userId === userId);
    }
    
    const details = deliveredShipments.map((s: any) => {
        const totalCOGS = s.products.reduce((sum: number, p: any) => sum + (p.costPrice * p.quantity), 0);
        const revenue = s.totalAmount;
        return {
            id: s.id,
            transactionId: s.transactionId,
            createdAt: s.createdAt,
            customerName: s.customerName,
            userId: s.userId,
            userName: db.users.find((u: any) => u.id === s.userId)?.username || 'N/A',
            totalRevenue: revenue,
            totalCOGS: totalCOGS,
            profit: revenue - totalCOGS,
        };
    });
    
    const totalRevenue = details.reduce((sum, d) => sum + d.totalRevenue, 0);
    const totalCOGS = details.reduce((sum, d) => sum + d.totalCOGS, 0);
    const grossProfit = totalRevenue - totalCOGS;
    
    const opExpenses = db.financialTransactions.filter((t: any) => 
        t.type === 'out' && 
        t.transactionDate >= startStr && 
        t.transactionDate <= endStr &&
        ['Biaya Operasional', 'Gaji Karyawan', 'Sewa', 'Listrik & Air', 'Transportasi'].includes(t.category)
    ).reduce((sum: number, t: any) => sum + t.amount, 0);
    
    return {
        totalRevenue,
        totalCOGS,
        grossProfit,
        operationalExpenses: opExpenses,
        netProfit: grossProfit - opExpenses,
        transactionDetails: details,
    };
}
