'use client';

import type { User, Shipment, Checkout, Expedition, Product, Packaging, Customer, StockMovement, Supplier, Purchase, Return, SortableProductField, SortOrder, FinancialTransaction, ShipmentProduct, Account, Transfer, PaymentStatus, SalesProfitReportData } from './types';
import { initialData } from './initial-data';
import { getNotificationContext } from '@/context/notification-context';

// This is a client-side in-memory store.
// In a real app, you'd use a proper state management library or server-side data fetching.
let data = JSON.parse(JSON.stringify(initialData));

const saveState = () => {
    // In a browser environment, you could use localStorage. For now, it's in-memory.
};

const createNotification = (notification: { recipientId: string; message: string; url?: string }) => {
    const { createNotification: create } = getNotificationContext();
    create(notification);
};

export async function login(username: string, password: string): Promise<User> {
    console.log("Attempting login with:", username, password);
    const user = data.users.find((u: User) => u.username === username && u.password === password);
    if (user) {
        console.log("Login successful for:", user.username);
        const { password, ...userToReturn } = user;
        return Promise.resolve(userToReturn);
    } else {
        console.error("Login failed for:", username);
        return Promise.reject(new Error('Username atau password salah.'));
    }
}

export async function getUsers(): Promise<User[]> {
    const users = data.users.map((u: User) => {
        const { password, ...userToReturn } = u;
        return userToReturn;
    });
    return Promise.resolve(users);
}

export async function addUser(userData: Omit<User, 'id'>): Promise<User> {
    const newUser: User = {
        ...userData,
        id: `usr_${Date.now()}`,
    };
    data.users.push(newUser);
    saveState();
    const { password, ...userToReturn } = newUser;
    
    createNotification({
        recipientId: 'admin',
        message: `Pengguna baru '${newUser.username}' telah ditambahkan.`,
    });

    return Promise.resolve(userToReturn);
}

export async function updateUser(id: string, userUpdate: Partial<Omit<User, 'id'>>): Promise<User> {
    const userIndex = data.users.findIndex((u: User) => u.id === id);
    if (userIndex === -1) {
        return Promise.reject(new Error("User not found"));
    }
    const updatedUser = { ...data.users[userIndex], ...userUpdate };
    data.users[userIndex] = updatedUser;
    saveState();
    const { password, ...userToReturn } = updatedUser;
    return Promise.resolve(userToReturn);
}

export async function deleteUser(id: string): Promise<void> {
    data.users = data.users.filter((u: User) => u.id !== id);
    saveState();
    return Promise.resolve();
}

export async function getCustomers(): Promise<Customer[]> {
    return Promise.resolve(data.customers);
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
    const newCustomer = { ...customerData, id: `cust_${Date.now()}` };
    data.customers.push(newCustomer);
    saveState();
    return Promise.resolve(newCustomer);
}

export async function updateCustomer(id: string, customerUpdate: Omit<Customer, 'id'>): Promise<Customer> {
    const index = data.customers.findIndex((c: Customer) => c.id === id);
    if (index === -1) return Promise.reject(new Error("Customer not found"));
    data.customers[index] = { ...data.customers[index], ...customerUpdate };
    saveState();
    return Promise.resolve(data.customers[index]);
}

export async function deleteCustomer(id: string): Promise<void> {
    data.customers = data.customers.filter((c: Customer) => c.id !== id);
    saveState();
    return Promise.resolve();
}

export async function getSuppliers(): Promise<Supplier[]> {
    return Promise.resolve(data.suppliers);
}

export async function addSupplier(supplierData: Omit<Supplier, 'id'>): Promise<Supplier> {
    const newSupplier: Supplier = { ...supplierData, id: `sup_${Date.now()}` };
    data.suppliers.push(newSupplier);
    saveState();
    return Promise.resolve(newSupplier);
}

export async function updateSupplier(id: string, supplierUpdate: Omit<Supplier, 'id'>): Promise<Supplier> {
    const index = data.suppliers.findIndex((s: Supplier) => s.id === id);
    if (index === -1) return Promise.reject(new Error("Supplier not found"));
    data.suppliers[index] = { ...data.suppliers[index], ...supplierUpdate };
    saveState();
    return Promise.resolve(data.suppliers[index]);
}

export async function deleteSupplier(id: string): Promise<void> {
    data.suppliers = data.suppliers.filter((s: Supplier) => s.id !== id);
    saveState();
    return Promise.resolve();
}

export async function getShipments(): Promise<Shipment[]> {
    // Deep copy to prevent mutations from affecting the in-memory "DB"
    return Promise.resolve(JSON.parse(JSON.stringify(data.shipments)));
}

export async function addShipment(shipmentData: Omit<Shipment, 'id' | 'createdAt' | 'status'>): Promise<Shipment> {
    const newShipment: Shipment = {
        ...shipmentData,
        id: `ship_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'Proses', // Default status
    };
    data.shipments.unshift(newShipment);
    saveState();

    createNotification({
        recipientId: 'admin',
        message: `Pengiriman baru #${newShipment.transactionId} telah dibuat oleh ${shipmentData.user}.`,
        url: '/shipments'
    });

    return Promise.resolve(newShipment);
}


export async function updateShipment(shipmentId: string, shipmentUpdate: Partial<Shipment>): Promise<Shipment> {
    const index = data.shipments.findIndex((s: Shipment) => s.id === shipmentId);
    if (index === -1) return Promise.reject(new Error('Shipment not found'));
    
    data.shipments[index] = { ...data.shipments[index], ...shipmentUpdate };
    saveState();
    return Promise.resolve(data.shipments[index]);
}


export async function deleteShipment(shipmentId: string): Promise<void> {
    data.shipments = data.shipments.filter((s: Shipment) => s.id !== shipmentId);
    saveState();
    return Promise.resolve();
}

export async function processShipmentsToPackaging(shipmentIds: string[]): Promise<void> {
    shipmentIds.forEach(id => {
        const shipment = data.shipments.find((s: Shipment) => s.id === id);
        if (shipment && shipment.status === 'Proses') {
            shipment.status = 'Pengemasan';
            
            // Deduct stock
            shipment.products.forEach((p: ShipmentProduct) => {
                const productMaster = data.products.find((prod: Product) => prod.id === p.productId);
                if (productMaster) {
                    const stockBefore = productMaster.stock;
                    productMaster.stock -= p.quantity;
                    
                    const movement: StockMovement = {
                        id: `sm_${Date.now()}`,
                        productId: p.productId,
                        referenceId: shipment.id,
                        type: 'Penjualan',
                        quantityChange: -p.quantity,
                        stockBefore,
                        stockAfter: productMaster.stock,
                        notes: `Penjualan dari No. Transaksi: ${shipment.transactionId}`,
                        createdAt: new Date().toISOString()
                    };
                    data.stockMovements.push(movement);
                }
            });

            createNotification({
                recipientId: shipment.userId,
                message: `Pesanan #${shipment.transactionId} sedang dikemas.`,
                url: '/my-shipments'
            });
        }
    });
    saveState();
    return Promise.resolve();
}


export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<void> {
    shipmentIds.forEach(id => {
        const shipment = data.shipments.find((s: Shipment) => s.id === id);
        if (shipment && shipment.status === 'Pengemasan') {
            shipment.status = 'Terkirim';
             shipment.paymentStatus = 'Lunas'; // Mark as paid
             shipment.paidAt = new Date().toISOString();

            // Create financial transaction
            const transaction: FinancialTransaction = {
                id: `ft_${Date.now()}`,
                accountId: shipment.accountId,
                type: 'in',
                amount: shipment.totalAmount,
                category: 'Penjualan Online',
                description: `Penjualan ${shipment.transactionId} kepada ${shipment.customerName}`,
                transactionDate: new Date().toISOString().split('T')[0],
                referenceId: shipment.id,
                createdAt: new Date().toISOString(),
                account: { name: '' } // placeholder
            };
            data.financialTransactions.push(transaction);

            // Update account balance
            const account = data.accounts.find((acc: Account) => acc.id === shipment.accountId);
            if (account) {
                account.balance += shipment.totalAmount;
            }

            createNotification({
                recipientId: shipment.userId,
                message: `Pesanan #${shipment.transactionId} telah dikirim.`,
                url: '/my-shipments'
            });
        }
    });
    saveState();
    return Promise.resolve();
}

export async function getExpeditions(): Promise<Expedition[]> {
    return Promise.resolve(data.expeditions);
}

export async function addExpedition(name: string): Promise<Expedition> {
    const newExpedition = { id: `exp_${Date.now()}`, name };
    data.expeditions.push(newExpedition);
    saveState();
    return Promise.resolve(newExpedition);
}

export async function updateExpedition(id: string, name: string): Promise<Expedition> {
    const index = data.expeditions.findIndex((e: Expedition) => e.id === id);
    if (index === -1) return Promise.reject(new Error("Expedition not found"));
    data.expeditions[index].name = name;
    saveState();
    return Promise.resolve(data.expeditions[index]);
}

export async function deleteExpedition(id: string): Promise<void> {
    data.expeditions = data.expeditions.filter((e: Expedition) => e.id !== id);
    saveState();
    return Promise.resolve();
}

export async function getProducts(sortBy: SortableProductField = 'code', sortOrder: SortOrder = 'asc'): Promise<Product[]> {
    const sorted = [...data.products].sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    return Promise.resolve(sorted);
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const newProduct = { ...product, id: `prod_${Date.now()}` };
    data.products.push(newProduct);
    saveState();
    return Promise.resolve(newProduct);
}

export async function updateProduct(id: string, productUpdate: Partial<Omit<Product, 'id'>>): Promise<Product> {
    const index = data.products.findIndex((p: Product) => p.id === id);
    if (index === -1) return Promise.reject(new Error("Product not found"));
    data.products[index] = { ...data.products[index], ...productUpdate };
    saveState();
    return Promise.resolve(data.products[index]);
}

export async function deleteMultipleProducts(ids: string[]): Promise<void> {
    data.products = data.products.filter((p: Product) => !ids.includes(p.id));
    saveState();
    return Promise.resolve();
}

export async function updateProductStock(id: string, newStock: number, notes: string): Promise<Product> {
    const index = data.products.findIndex((p: Product) => p.id === id);
    if (index === -1) return Promise.reject(new Error("Product not found"));
    
    const product = data.products[index];
    const stockBefore = product.stock;
    product.stock = newStock;
    
    const movement: StockMovement = {
        id: `sm_${Date.now()}`,
        productId: id,
        type: 'Stok Opname',
        quantityChange: newStock - stockBefore,
        stockBefore,
        stockAfter: newStock,
        notes,
        createdAt: new Date().toISOString()
    };
    data.stockMovements.push(movement);
    
    saveState();
    return Promise.resolve(product);
}

export async function bulkUpdateProductStock(updates: { code: string; physicalStock: number; notes: string }[]): Promise<{ success: number; failure: number }> {
    let success = 0;
    let failure = 0;
    updates.forEach(update => {
        const product = data.products.find((p: Product) => p.code === update.code);
        if (product) {
            const stockBefore = product.stock;
            product.stock = update.physicalStock;
            const movement: StockMovement = {
                id: `sm_${Date.now()}`,
                productId: product.id,
                referenceId: `opname_${new Date().toISOString()}`,
                type: 'Stok Opname',
                quantityChange: update.physicalStock - stockBefore,
                stockBefore,
                stockAfter: update.physicalStock,
                notes: update.notes,
                createdAt: new Date().toISOString(),
            };
            data.stockMovements.push(movement);
            success++;
        } else {
            failure++;
        }
    });
    saveState();
    return Promise.resolve({ success, failure });
}

export async function getStockMovements(productId: string): Promise<StockMovement[]> {
    const movements = data.stockMovements.filter((m: StockMovement) => m.productId === productId);
    return Promise.resolve(movements.sort((a: StockMovement, b: StockMovement) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
}

export async function getPackagingOptions(): Promise<Packaging[]> {
    return Promise.resolve(data.packagingOptions);
}

export async function addPackagingOption(packagingData: Omit<Packaging, 'id'>): Promise<Packaging> {
    const newOption = { ...packagingData, id: `pkg_${Date.now()}` };
    data.packagingOptions.push(newOption);
    saveState();
    return Promise.resolve(newOption);
}

export async function updatePackagingOption(id: string, packagingUpdate: Omit<Packaging, 'id'>): Promise<Packaging> {
    const index = data.packagingOptions.findIndex((p: Packaging) => p.id === id);
    if (index === -1) return Promise.reject(new Error("Packaging option not found"));
    data.packagingOptions[index] = { ...data.packagingOptions[index], ...packagingUpdate };
    saveState();
    return Promise.resolve(data.packagingOptions[index]);
}

export async function deletePackagingOption(id: string): Promise<void> {
    data.packagingOptions = data.packagingOptions.filter((p: Packaging) => p.id !== id);
    saveState();
    return Promise.resolve();
}

export async function getPurchases(): Promise<Purchase[]> {
    return Promise.resolve(data.purchases);
}

export async function addPurchase(purchaseData: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase> {
    const newPurchase: Purchase = {
        ...purchaseData,
        id: `purch_${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    data.purchases.unshift(newPurchase);

    // Update stock and create stock movements
    newPurchase.products.forEach(p => {
        const productMaster = data.products.find((prod: Product) => prod.id === p.productId);
        if (productMaster) {
            const stockBefore = productMaster.stock;
            productMaster.stock += p.quantity;
            const movement: StockMovement = {
                id: `sm_${Date.now()}`,
                productId: p.productId,
                referenceId: newPurchase.id,
                type: 'Pembelian',
                quantityChange: p.quantity,
                stockBefore,
                stockAfter: productMaster.stock,
                notes: `Pembelian dari ${newPurchase.supplierName} - No: ${newPurchase.purchaseNumber}`,
                createdAt: new Date().toISOString()
            };
            data.stockMovements.push(movement);
        }
    });
    
    // Create financial transaction if paid
    if (newPurchase.paymentStatus === 'Lunas' && newPurchase.accountId) {
        const transaction: FinancialTransaction = {
            id: `ft_${Date.now()}`,
            accountId: newPurchase.accountId,
            type: 'out',
            amount: newPurchase.totalAmount,
            category: 'Pembelian Stok',
            description: `Pembelian ${newPurchase.purchaseNumber} dari ${newPurchase.supplierName}`,
            transactionDate: new Date().toISOString().split('T')[0],
            referenceId: newPurchase.id,
            createdAt: new Date().toISOString(),
            account: { name: ''}
        };
        data.financialTransactions.push(transaction);

        const account = data.accounts.find((acc: Account) => acc.id === newPurchase.accountId);
        if (account) {
            account.balance -= newPurchase.totalAmount;
        }
    }
    
    saveState();
    return Promise.resolve(newPurchase);
}

export async function processDirectSale(user: User, customerId: string, products: ShipmentProduct[], accountId: string, paymentStatus: PaymentStatus): Promise<Shipment> {
    const customer = data.customers.find((c: Customer) => c.id === customerId);
    if (!customer) throw new Error("Customer not found");

    const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalAmount = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const totalCOGS = products.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
    const totalRevenue = totalAmount; // For direct sale, revenue is total amount

    const newShipment: Shipment = {
        id: `ship_${Date.now()}`,
        userId: user.id,
        transactionId: `POS-${user.username.toUpperCase()}-${Date.now()}`,
        customerId,
        customerName: customer.name,
        expedition: 'Penjualan Langsung',
        packagingId: '',
        packagingCost: 0,
        accountId,
        status: 'Terkirim', // Direct sales are immediately 'Terkirim'
        paymentStatus,
        products,
        totalItems,
        totalProductCost: totalCOGS, // totalProductCost should be COGS
        totalPackingCost: 0,
        totalAmount: totalAmount,
        totalRevenue: totalRevenue,
        createdAt: new Date().toISOString(),
        paidAt: paymentStatus === 'Lunas' ? new Date().toISOString() : undefined,
    };
    data.shipments.unshift(newShipment);

    // Update stock and movements
    products.forEach(p => {
        const productMaster = data.products.find((prod: Product) => prod.id === p.productId);
        if (productMaster) {
            if (productMaster.stock < p.quantity) {
                throw new Error(`Insufficient stock for ${p.name}`);
            }
            const stockBefore = productMaster.stock;
            productMaster.stock -= p.quantity;
            const movement: StockMovement = {
                id: `sm_${Date.now()}`,
                productId: p.productId,
                referenceId: newShipment.id,
                type: 'Penjualan',
                quantityChange: -p.quantity,
                stockBefore,
                stockAfter: productMaster.stock,
                notes: `Penjualan langsung: ${newShipment.transactionId}`,
                createdAt: new Date().toISOString()
            };
            data.stockMovements.push(movement);
        }
    });

    // Create financial transaction
    if (paymentStatus === 'Lunas') {
        const transaction: FinancialTransaction = {
            id: `ft_${Date.now()}`,
            accountId,
            type: 'in',
            amount: totalAmount,
            category: 'Penjualan Tunai',
            description: `Penjualan ${newShipment.transactionId} kepada ${customer.name}`,
            transactionDate: new Date().toISOString().split('T')[0],
            referenceId: newShipment.id,
            createdAt: new Date().toISOString(),
            account: { name: '' }
        };
        data.financialTransactions.push(transaction);

        const account = data.accounts.find((acc: Account) => acc.id === accountId);
        if (account) {
            account.balance += totalAmount;
        }
    }
    
    saveState();
    return Promise.resolve(newShipment);
}

export async function getReturns(): Promise<Return[]> {
    return Promise.resolve(data.returns);
}

export async function addReturn(returnData: Omit<Return, 'id' | 'createdAt' | 'originalTransactionId' | 'customerName'> & { originalShipmentId: string }): Promise<Return> {
    const originalShipment = data.shipments.find((s: Shipment) => s.id === returnData.originalShipmentId);
    if (!originalShipment) throw new Error("Original shipment not found.");

    const totalAmount = returnData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

    const newReturn: Return = {
        ...returnData,
        id: `ret_${Date.now()}`,
        originalTransactionId: originalShipment.transactionId,
        customerName: originalShipment.customerName,
        totalAmount,
        createdAt: new Date().toISOString(),
    };
    data.returns.unshift(newReturn);

    // Update stock
    newReturn.products.forEach(p => {
        const productMaster = data.products.find((prod: Product) => prod.id === p.productId);
        if (productMaster) {
            const stockBefore = productMaster.stock;
            productMaster.stock += p.quantity;
            const movement: StockMovement = {
                id: `sm_${Date.now()}`,
                productId: p.productId,
                referenceId: newReturn.id,
                type: 'Retur',
                quantityChange: p.quantity,
                stockBefore,
                stockAfter: productMaster.stock,
                notes: `Retur dari No. Transaksi: ${newReturn.originalTransactionId}`,
                createdAt: new Date().toISOString()
            };
            data.stockMovements.push(movement);
        }
    });

    saveState();
    return Promise.resolve(newReturn);
}

export async function getStockOpnameMovements(startDate?: Date, endDate?: Date): Promise<(StockMovement & { productCode: string, productName: string })[]> {
    let filtered = data.stockMovements.filter((m: StockMovement) => m.type === 'Stok Opname');
    
    if (startDate) {
        filtered = filtered.filter((m: StockMovement) => new Date(m.createdAt) >= startDate);
    }
    if (endDate) {
        filtered = filtered.filter((m: StockMovement) => new Date(m.createdAt) <= endDate);
    }

    const result = filtered.map((m: StockMovement) => {
        const product = data.products.find((p: Product) => p.id === m.productId);
        return {
            ...m,
            productCode: product?.code || 'N/A',
            productName: product?.name || 'N/A',
        };
    });

    return Promise.resolve(result.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
}

export async function getAccounts(): Promise<Account[]> {
    return Promise.resolve(data.accounts);
}

export async function addAccount(accountData: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    const newAccount = { ...accountData, id: `acc_${Date.now()}`, createdAt: new Date().toISOString(), balance: accountData.balance || 0 };
    data.accounts.push(newAccount);

    if (newAccount.balance > 0) {
        const transaction: FinancialTransaction = {
            id: `ft_${Date.now()}`,
            accountId: newAccount.id,
            type: 'in',
            amount: newAccount.balance,
            category: 'Saldo Awal',
            description: `Saldo awal untuk akun ${newAccount.name}`,
            transactionDate: new Date().toISOString().split('T')[0],
            referenceId: `init_${newAccount.id}`,
            createdAt: new Date().toISOString(),
            account: { name: '' }
        };
        data.financialTransactions.push(transaction);
    }
    
    saveState();
    return Promise.resolve(newAccount);
}

export async function updateAccount(id: string, accountUpdate: Partial<Omit<Account, 'id' | 'createdAt' | 'balance'>>): Promise<Account> {
    const index = data.accounts.findIndex((acc: Account) => acc.id === id);
    if (index === -1) return Promise.reject(new Error("Account not found"));
    data.accounts[index] = { ...data.accounts[index], ...accountUpdate };
    saveState();
    return Promise.resolve(data.accounts[index]);
}

export async function deleteAccount(id: string): Promise<void> {
    const hasTransactions = data.financialTransactions.some((tx: FinancialTransaction) => tx.accountId === id);
    if(hasTransactions) {
        return Promise.reject(new Error('Cannot delete account with existing transactions'));
    }
    data.accounts = data.accounts.filter((acc: Account) => acc.id !== id);
    saveState();
    return Promise.resolve();
}

export async function getFinancialTransactions(type?: 'in' | 'out', startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    let filtered = data.financialTransactions.map((tx: FinancialTransaction) => ({
        ...tx,
        account: { name: data.accounts.find((a:Account) => a.id === tx.accountId)?.name || 'Unknown' }
    }));

    if (type) {
        filtered = filtered.filter((tx: FinancialTransaction) => tx.type === type);
    }
    if (startDate) {
        filtered = filtered.filter((tx: FinancialTransaction) => tx.transactionDate >= startDate);
    }
    if (endDate) {
        filtered = filtered.filter((tx: FinancialTransaction) => tx.transactionDate <= endDate);
    }

    return Promise.resolve(filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
}

export async function addFinancialTransaction(txData: Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>): Promise<FinancialTransaction> {
    const newTransaction = { ...txData, id: `ft_${Date.now()}`, createdAt: new Date().toISOString(), account: { name: '' } };
    data.financialTransactions.unshift(newTransaction);
    
    const account = data.accounts.find((acc: Account) => acc.id === txData.accountId);
    if (account) {
        if (txData.type === 'in') {
            account.balance += txData.amount;
        } else {
            account.balance -= txData.amount;
        }
    }
    
    saveState();
    return Promise.resolve(newTransaction);
}

export async function updateFinancialTransaction(id: string, txUpdate: Partial<Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>>): Promise<FinancialTransaction> {
    const index = data.financialTransactions.findIndex((tx: FinancialTransaction) => tx.id === id);
    if (index === -1) return Promise.reject(new Error("Transaction not found"));

    const originalTx = data.financialTransactions[index];

    // Revert old transaction from balance
    const originalAccount = data.accounts.find((acc: Account) => acc.id === originalTx.accountId);
    if (originalAccount) {
        originalAccount.balance += originalTx.type === 'in' ? -originalTx.amount : originalTx.amount;
    }

    const updatedTx = { ...originalTx, ...txUpdate };
    data.financialTransactions[index] = updatedTx;

    // Apply new transaction to balance
    const newAccount = data.accounts.find((acc: Account) => acc.id === updatedTx.accountId);
    if (newAccount) {
        newAccount.balance += updatedTx.type === 'in' ? updatedTx.amount : -updatedTx.amount;
    }
    
    saveState();
    return Promise.resolve(updatedTx);
}

export async function deleteFinancialTransaction(id: string): Promise<void> {
    const index = data.financialTransactions.findIndex((tx: FinancialTransaction) => tx.id === id);
    if (index === -1) return Promise.reject(new Error("Transaction not found"));
    
    const txToDelete = data.financialTransactions[index];
    if (txToDelete.referenceId) {
        return Promise.reject(new Error("Cannot delete transactions linked to sales, purchases, or transfers."));
    }

    const account = data.accounts.find((acc: Account) => acc.id === txToDelete.accountId);
    if (account) {
        account.balance += txToDelete.type === 'in' ? -txToDelete.amount : txToDelete.amount;
    }

    data.financialTransactions.splice(index, 1);
    saveState();
    return Promise.resolve();
}

export async function addInternalTransfer(transferData: Transfer): Promise<{ message: string }> {
    const fromAccount = data.accounts.find((acc: Account) => acc.id === transferData.fromAccountId);
    const toAccount = data.accounts.find((acc: Account) => acc.id === transferData.toAccountId);

    if (!fromAccount || !toAccount) throw new Error("Account not found");

    fromAccount.balance -= transferData.amount;
    toAccount.balance += transferData.amount;
    
    const transferId = `trf_${Date.now()}`;
    const dateStr = transferData.transferDate.toISOString().split('T')[0];

    data.financialTransactions.unshift(
        { id: `ft_${Date.now()}_out`, accountId: fromAccount.id, type: 'out', amount: transferData.amount, category: 'Transfer Keluar', description: transferData.description, transactionDate: dateStr, referenceId: transferId, createdAt: new Date().toISOString(), account: { name: '' } },
        { id: `ft_${Date.now()}_in`, accountId: toAccount.id, type: 'in', amount: transferData.amount, category: 'Transfer Masuk', description: transferData.description, transactionDate: dateStr, referenceId: transferId, createdAt: new Date().toISOString(), account: { name: '' } },
    );
    
    saveState();
    return Promise.resolve({ message: 'Transfer successful' });
}

export async function getSalesProfitReport(startDate: Date, endDate: Date, userId: string = 'all'): Promise<SalesProfitReportData> {
    let deliveredShipments = data.shipments.filter((s: Shipment) => 
        s.status === 'Terkirim' && 
        new Date(s.createdAt) >= startDate && 
        new Date(s.createdAt) <= endDate
    );
    
    if (userId !== 'all') {
        deliveredShipments = deliveredShipments.filter((s: Shipment) => s.userId === userId);
    }
    
    let totalRevenue = 0;
    let totalCOGS = 0;

    const transactionDetails = deliveredShipments.map((shipment: Shipment) => {
        const cogs = shipment.products.reduce((sum, p) => sum + (p.costPrice || 0) * p.quantity, 0);
        const profit = shipment.totalRevenue - cogs;
        totalRevenue += shipment.totalRevenue;
        totalCOGS += cogs;
        const user = data.users.find((u:User) => u.id === shipment.userId);
        return {
            id: shipment.id,
            transactionId: shipment.transactionId,
            createdAt: shipment.createdAt,
            customerName: shipment.customerName,
            userId: shipment.userId,
            userName: user?.username || 'N/A',
            totalRevenue: shipment.totalRevenue,
            totalCOGS: cogs,
            profit: profit,
        };
    });
    
    const grossProfit = totalRevenue - totalCOGS;

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const expenses = data.financialTransactions.filter((tx: FinancialTransaction) => 
        tx.type === 'out' && 
        tx.category !== 'Pembelian Stok' && 
        tx.category !== 'Pelunasan Utang' &&
        tx.transactionDate >= startDateStr &&
        tx.transactionDate <= endDateStr
    );
    
    const operationalExpenses = expenses.reduce((sum: number, tx: FinancialTransaction) => sum + tx.amount, 0);
    const netProfit = grossProfit - operationalExpenses;

    const reportData: SalesProfitReportData = {
        totalRevenue,
        totalCOGS,
        grossProfit,
        operationalExpenses,
        netProfit,
        transactionDetails,
    };

    return Promise.resolve(reportData);
}

export async function payReceivable(shipmentId: string, accountId: string, paidAt: Date): Promise<void> {
    const shipment = data.shipments.find((s: Shipment) => s.id === shipmentId);
    if (!shipment) throw new Error("Shipment not found");

    shipment.paymentStatus = 'Lunas';
    shipment.paidAt = paidAt.toISOString();

    const transaction: FinancialTransaction = {
        id: `ft_${Date.now()}`,
        accountId: accountId,
        type: 'in',
        amount: shipment.totalAmount,
        category: 'Penerimaan Piutang',
        description: `Penerimaan pembayaran untuk ${shipment.transactionId} dari ${shipment.customerName}`,
        transactionDate: paidAt.toISOString().split('T')[0],
        referenceId: shipment.id,
        createdAt: new Date().toISOString(),
        account: { name: '' }
    };
    data.financialTransactions.push(transaction);

    const account = data.accounts.find((acc: Account) => acc.id === accountId);
    if (account) {
        account.balance += shipment.totalAmount;
    }

    saveState();
    return Promise.resolve();
}

export async function payPayable(purchaseId: string, accountId: string, paidAt: Date): Promise<void> {
    const purchase = data.purchases.find((p: Purchase) => p.id === purchaseId);
    if (!purchase) throw new Error("Purchase not found");
    
    purchase.paymentStatus = 'Lunas';
    purchase.paidAt = paidAt.toISOString();
    purchase.accountId = accountId;

    const transaction: FinancialTransaction = {
        id: `ft_${Date.now()}`,
        accountId: accountId,
        type: 'out',
        amount: purchase.totalAmount,
        category: 'Pelunasan Utang',
        description: `Pembayaran utang untuk pembelian ${purchase.purchaseNumber} dari ${purchase.supplierName}`,
        transactionDate: paidAt.toISOString().split('T')[0],
        referenceId: purchase.id,
        createdAt: new Date().toISOString(),
        account: { name: '' }
    };
    data.financialTransactions.push(transaction);

    const account = data.accounts.find((acc: Account) => acc.id === accountId);
    if (account) {
        account.balance -= purchase.totalAmount;
    }

    saveState();
    return Promise.resolve();
}
