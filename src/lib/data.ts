
'use client';

import type { User, Shipment, Checkout, Expedition, Product, Packaging, Customer, StockMovement, Supplier, Purchase, Return, SortableProductField, SortOrder, FinancialTransaction, ShipmentProduct, Account, Transfer, PaymentStatus } from './types';
import dbData from '../../db.json';
import { SalesProfitReportData } from '@/app/api/reports/sales-profit/route';

// In-memory database simulation
let data = JSON.parse(JSON.stringify(dbData)) as typeof dbData;


const saveChanges = () => {
  // In a real scenario, this would write back to a file or API.
  // For this client-side simulation, it does nothing, changes are in-memory.
  console.log("Data changes are in-memory and will be lost on refresh.");
};


// =================================================================
// Data Access Functions (Client-Side Simulation)
// =================================================================

// --- User Functions ---
export async function login(username: string, password: string): Promise<User> {
    const user = data.users.find(u => u.username === username && u.password === password);
    if (user) {
        const { password, ...userToReturn } = user;
        return Promise.resolve(userToReturn as User);
    }
    throw new Error('Username atau password salah.');
}

export async function getUsers(): Promise<User[]> {
    return Promise.resolve(data.users.map(u => {
        const { password, ...userToReturn } = u;
        return userToReturn as User;
    }));
}

export async function addUser(userData: Omit<User, 'id'>): Promise<User> {
    const newUser: User = { ...userData, id: `usr_${Date.now()}` };
    data.users.push(newUser);
    saveChanges();
    const { password, ...userToReturn } = newUser;
    return Promise.resolve(userToReturn as User);
}

export async function updateUser(id: string, userUpdate: Partial<Omit<User, 'id'>>): Promise<User> {
    const userIndex = data.users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error("User not found");
    data.users[userIndex] = { ...data.users[userIndex], ...userUpdate };
    saveChanges();
    const { password, ...userToReturn } = data.users[userIndex];
    return Promise.resolve(userToReturn as User);
}

export async function deleteUser(id: string): Promise<void> {
    data.users = data.users.filter(u => u.id !== id);
    saveChanges();
    return Promise.resolve();
}

// --- Customer Functions ---
export async function getCustomers(): Promise<Customer[]> {
    return Promise.resolve(data.customers);
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
    const newCustomer: Customer = { ...customerData, id: `cust_${Date.now()}` };
    data.customers.push(newCustomer);
    saveChanges();
    return Promise.resolve(newCustomer);
}

export async function updateCustomer(id: string, customerUpdate: Omit<Customer, 'id'>): Promise<Customer> {
    const index = data.customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Customer not found");
    data.customers[index] = { ...data.customers[index], ...customerUpdate };
    saveChanges();
    return Promise.resolve(data.customers[index]);
}

export async function deleteCustomer(id: string): Promise<void> {
    data.customers = data.customers.filter(c => c.id !== id);
    saveChanges();
    return Promise.resolve();
}

// --- Supplier Functions ---
export async function getSuppliers(): Promise<Supplier[]> {
    return Promise.resolve(data.suppliers);
}

export async function addSupplier(supplierData: Omit<Supplier, 'id'>): Promise<Supplier> {
    const newSupplier: Supplier = { ...supplierData, id: `sup_${Date.now()}` };
    data.suppliers.push(newSupplier);
    saveChanges();
    return Promise.resolve(newSupplier);
}

export async function updateSupplier(id: string, supplierUpdate: Omit<Supplier, 'id'>): Promise<Supplier> {
    const index = data.suppliers.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Supplier not found");
    data.suppliers[index] = { ...data.suppliers[index], ...supplierUpdate };
    saveChanges();
    return Promise.resolve(data.suppliers[index]);
}

export async function deleteSupplier(id: string): Promise<void> {
    data.suppliers = data.suppliers.filter(s => s.id !== id);
    saveChanges();
    return Promise.resolve();
}


// --- Shipment Functions ---
export async function getShipments(): Promise<Shipment[]> {
    return Promise.resolve(data.shipments);
}

export async function addShipment(shipmentData: any): Promise<Shipment> {
    const user = data.users.find(u => u.username === shipmentData.user);
    const customer = data.customers.find(c => c.id === shipmentData.customerId);
    if(!user || !customer) throw new Error("User or Customer not found");

    const totalItems = shipmentData.products.reduce((sum: number, p: any) => sum + p.quantity, 0);
    const totalProductCost = shipmentData.products.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
    const totalAmount = totalProductCost + shipmentData.packagingCost;

    const productsWithCostPrice = shipmentData.products.map((p: any) => {
        const masterProduct = data.products.find(mp => mp.id === p.productId);
        return {...p, costPrice: masterProduct?.costPrice || 0};
    })

    const newShipment: Shipment = {
        ...shipmentData,
        id: `ship_${Date.now()}`,
        userId: user.id,
        customerName: customer.name,
        status: 'Proses',
        products: productsWithCostPrice,
        totalItems,
        totalProductCost,
        totalPackingCost: shipmentData.packagingCost,
        totalAmount,
        totalRevenue: totalAmount, // For sales reports
        createdAt: new Date().toISOString(),
    };
    data.shipments.push(newShipment);

    // If it's a direct sale ('Terkirim'), we also create the financial transaction
    if (newShipment.status === 'Terkirim') {
         await addFinancialTransaction({
            accountId: newShipment.accountId,
            type: 'in',
            amount: newShipment.totalAmount,
            category: 'Penjualan Tunai',
            description: `Penjualan ${newShipment.transactionId} kepada ${newShipment.customerName}`,
            transactionDate: new Date().toISOString().split('T')[0],
            referenceId: newShipment.id,
        });
    }


    saveChanges();
    return Promise.resolve(newShipment);
}

export async function updateShipment(shipmentId: string, shipmentUpdate: any): Promise<Shipment> {
    const index = data.shipments.findIndex(s => s.id === shipmentId);
    if (index === -1) throw new Error("Shipment not found");

    const user = data.users.find(u => u.username === shipmentUpdate.user);
    const customer = data.customers.find(c => c.id === shipmentUpdate.customerId);
    if(!user || !customer) throw new Error("User or Customer not found");
    
    const totalItems = shipmentUpdate.products.reduce((sum: number, p: any) => sum + p.quantity, 0);
    const totalProductCost = shipmentUpdate.products.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
    const totalAmount = totalProductCost + shipmentUpdate.packagingCost;

    const updatedShipment = {
        ...data.shipments[index],
        ...shipmentUpdate,
        userId: user.id,
        customerName: customer.name,
        totalItems,
        totalProductCost,
        totalPackingCost: shipmentUpdate.packagingCost,
        totalAmount,
        totalRevenue: totalAmount,
    };
    data.shipments[index] = updatedShipment;
    saveChanges();
    return Promise.resolve(updatedShipment);
}

export async function deleteShipment(shipmentId: string): Promise<void> {
    data.shipments = data.shipments.filter(s => s.id !== shipmentId);
    saveChanges();
    return Promise.resolve();
}


// --- History/Checkout Functions ---
export async function processShipmentsToPackaging(shipmentIds: string[]): Promise<void> {
    shipmentIds.forEach(id => {
        const shipmentIndex = data.shipments.findIndex(s => s.id === id);
        if (shipmentIndex > -1) {
            const shipment = data.shipments[shipmentIndex];
            
            // Check stock before processing
            for (const product of shipment.products) {
                const productIndex = data.products.findIndex(p => p.id === product.productId);
                if (productIndex > -1) {
                    if (data.products[productIndex].stock < product.quantity) {
                        throw new Error(`Stok tidak cukup untuk produk ${data.products[productIndex].name}.`);
                    }
                } else {
                     throw new Error(`Produk dengan ID ${product.productId} tidak ditemukan.`);
                }
            }

            // Reduce stock and create movement log
            shipment.products.forEach(product => {
                const productIndex = data.products.findIndex(p => p.id === product.productId);
                const currentStock = data.products[productIndex].stock;
                const newStock = currentStock - product.quantity;
                
                data.stockMovements.push({
                    id: `sm_${Date.now()}`,
                    productId: product.productId,
                    referenceId: shipment.id,
                    type: 'Penjualan',
                    quantityChange: -product.quantity,
                    stockBefore: currentStock,
                    stockAfter: newStock,
                    notes: `Penjualan dari No. Transaksi: ${shipment.transactionId}`,
                    createdAt: new Date().toISOString(),
                });

                data.products[productIndex].stock = newStock;
            });

            data.shipments[shipmentIndex].status = 'Pengemasan';
        }
    });
    saveChanges();
    return Promise.resolve();
}

export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<void> {
    for (const id of shipmentIds) {
        const shipmentIndex = data.shipments.findIndex(s => s.id === id);
        if (shipmentIndex > -1) {
            const shipment = data.shipments[shipmentIndex];
            if (!shipment.accountId) {
                throw new Error(`Shipment ${shipment.transactionId} does not have a payment account set.`);
            }
            data.shipments[shipmentIndex].status = 'Terkirim';

            // Create financial transaction
            await addFinancialTransaction({
                accountId: shipment.accountId,
                type: 'in',
                amount: shipment.totalAmount,
                category: 'Penjualan Online',
                description: `Penjualan ${shipment.transactionId} kepada ${shipment.customerName}`,
                transactionDate: new Date().toISOString().split('T')[0],
                referenceId: shipment.id,
            });
        }
    }
    saveChanges();
    return Promise.resolve();
}


// --- Expedition Functions ---
export async function getExpeditions(): Promise<Expedition[]> {
    return Promise.resolve(data.expeditions);
}

export async function addExpedition(name: string): Promise<Expedition> {
    const newExpedition = { id: `exp_${Date.now()}`, name };
    data.expeditions.push(newExpedition);
    saveChanges();
    return Promise.resolve(newExpedition);
}

export async function updateExpedition(id: string, name: string): Promise<Expedition> {
    const index = data.expeditions.findIndex(e => e.id === id);
    if (index === -1) throw new Error("Expedition not found");
    data.expeditions[index].name = name;
    saveChanges();
    return Promise.resolve(data.expeditions[index]);
}

export async function deleteExpedition(id: string): Promise<void> {
    data.expeditions = data.expeditions.filter(e => e.id !== id);
    saveChanges();
    return Promise.resolve();
}


// --- Master Product Functions ---
export async function getProducts(sortBy: SortableProductField = 'code', sortOrder: SortOrder = 'asc'): Promise<Product[]> {
    const sorted = [...data.products].sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    return Promise.resolve(sorted);
}


export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const existing = data.products.find(p => p.code.toLowerCase() === product.code.toLowerCase());
    if (existing) {
        throw new Error("Produk dengan kode yang sama sudah ada.");
    }
    const newProduct: Product = { ...product, id: `prod_${Date.now()}` };
    data.products.push(newProduct);
    saveChanges();
    return Promise.resolve(newProduct);
}

export async function updateProduct(id: string, productUpdate: Partial<Omit<Product, 'id'>>): Promise<Product> {
    const index = data.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");
    data.products[index] = { ...data.products[index], ...productUpdate };
    saveChanges();
    return Promise.resolve(data.products[index]);
}

export async function deleteMultipleProducts(ids: string[]): Promise<void> {
    data.products = data.products.filter(p => !ids.includes(p.id));
    saveChanges();
    return Promise.resolve();
}


export async function updateProductStock(id: string, newStock: number, notes: string): Promise<Product> {
    const index = data.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");
    
    const product = data.products[index];
    const stockBefore = product.stock;
    const quantityChange = newStock - stockBefore;
    
    product.stock = newStock;
    
    data.stockMovements.push({
        id: `sm_${Date.now()}`,
        productId: id,
        type: 'Stok Opname',
        quantityChange: quantityChange,
        stockBefore: stockBefore,
        stockAfter: newStock,
        notes: notes,
        createdAt: new Date().toISOString(),
    });
    
    saveChanges();
    return Promise.resolve(product);
}

export async function bulkUpdateProductStock(updates: { code: string; physicalStock: number; notes: string }[]): Promise<{ success: number; failure: number }> {
    let success = 0;
    let failure = 0;
    for (const update of updates) {
        const product = data.products.find(p => p.code === update.code);
        if (product) {
            await updateProductStock(product.id, update.physicalStock, update.notes);
            success++;
        } else {
            failure++;
        }
    }
    return Promise.resolve({ success, failure });
}


export async function getStockMovements(productId: string): Promise<StockMovement[]> {
    const movements = data.stockMovements.filter(m => m.productId === productId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return Promise.resolve(movements);
}

// --- Packaging Functions ---
export async function getPackagingOptions(): Promise<Packaging[]> {
    return Promise.resolve(data.packagingOptions);
}

export async function addPackagingOption(packagingData: Omit<Packaging, 'id'>): Promise<Packaging> {
    const newOption = { ...packagingData, id: `pkg_${Date.now()}` };
    data.packagingOptions.push(newOption);
    saveChanges();
    return Promise.resolve(newOption);
}

export async function updatePackagingOption(id: string, packagingUpdate: Omit<Packaging, 'id'>): Promise<Packaging> {
    const index = data.packagingOptions.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Packaging option not found");
    data.packagingOptions[index] = { ...data.packagingOptions[index], ...packagingUpdate };
    saveChanges();
    return Promise.resolve(data.packagingOptions[index]);
}

export async function deletePackagingOption(id: string): Promise<void> {
    data.packagingOptions = data.packagingOptions.filter(p => p.id !== id);
    saveChanges();
    return Promise.resolve();
}

// --- Purchase Functions ---
export async function getPurchases(): Promise<Purchase[]> {
    return Promise.resolve(data.purchases);
}

export async function addPurchase(purchaseData: any): Promise<Purchase> {
    const totalAmount = purchaseData.products.reduce((sum: number, p: any) => sum + p.costPrice * p.quantity, 0);
    const newPurchase: Purchase = {
        ...purchaseData,
        id: `purch_${Date.now()}`,
        status: 'Selesai',
        totalAmount,
        createdAt: new Date().toISOString(),
    };

    // Update stock and add stock movements
    for (const product of newPurchase.products) {
        const productIndex = data.products.findIndex(p => p.id === product.productId);
        if (productIndex !== -1) {
            const stockBefore = data.products[productIndex].stock;
            const stockAfter = stockBefore + product.quantity;
            data.products[productIndex].stock = stockAfter;

            data.stockMovements.push({
                id: `sm_${Date.now()}`,
                productId: product.productId,
                referenceId: newPurchase.id,
                type: 'Pembelian',
                quantityChange: product.quantity,
                stockBefore: stockBefore,
                stockAfter: stockAfter,
                notes: `Pembelian dari ${newPurchase.supplierName} - No: ${newPurchase.purchaseNumber}`,
                createdAt: new Date().toISOString(),
            });
        }
    }
    
    // Add financial transaction if paid
    if (newPurchase.paymentStatus === 'Lunas' && newPurchase.accountId) {
        await addFinancialTransaction({
            accountId: newPurchase.accountId,
            type: 'out',
            amount: newPurchase.totalAmount,
            category: 'Pembelian Stok',
            description: `Pembelian ${newPurchase.purchaseNumber} dari ${newPurchase.supplierName}`,
            transactionDate: new Date().toISOString().split('T')[0],
            referenceId: newPurchase.id,
        });
    }

    data.purchases.push(newPurchase);
    saveChanges();
    return Promise.resolve(newPurchase);
}

// --- Direct Sale Function ---
export async function processDirectSale(user: User, customerId: string, products: ShipmentProduct[], accountId: string, paymentStatus: PaymentStatus): Promise<Shipment> {
    const shipmentData = {
        user: user.username,
        transactionId: `POS-${user.username.toUpperCase()}-${Date.now()}`,
        customerId,
        expedition: 'Penjualan Langsung',
        packagingId: data.packagingOptions[0]?.id || '',
        packagingCost: 0,
        products,
        status: 'Terkirim',
        accountId,
        paymentStatus,
    };
    
    // Create the shipment
    const newShipment = await addShipment(shipmentData);
    
    // Update stock
    for (const product of newShipment.products) {
        const productIndex = data.products.findIndex(p => p.id === product.productId);
        if (productIndex !== -1) {
            const stockBefore = data.products[productIndex].stock;
            if (stockBefore < product.quantity) {
                throw new Error(`Stok tidak cukup untuk produk ${product.name}.`);
            }
            const stockAfter = stockBefore - product.quantity;
            data.products[productIndex].stock = stockAfter;

            data.stockMovements.push({
                id: `sm_${Date.now()}`,
                productId: product.productId,
                referenceId: newShipment.id,
                type: 'Penjualan',
                quantityChange: -product.quantity,
                stockBefore: stockBefore,
                stockAfter: stockAfter,
                notes: `Penjualan langsung: ${newShipment.transactionId}`,
                createdAt: new Date().toISOString(),
            });
        }
    }

    return Promise.resolve(newShipment);
}

// --- Return Functions ---
export async function getReturns(): Promise<Return[]> {
    return Promise.resolve(data.returns);
}


export async function addReturn(returnData: any): Promise<Return> {
    const originalShipment = data.shipments.find(s => s.id === returnData.originalShipmentId);
    if (!originalShipment) throw new Error("Original shipment not found.");

    const totalAmount = returnData.products.reduce((sum: number, p: any) => sum + p.price * p.quantity, 0);

    const newReturn: Return = {
        ...returnData,
        id: `ret_${Date.now()}`,
        originalTransactionId: originalShipment.transactionId,
        customerName: originalShipment.customerName,
        totalAmount,
        createdAt: new Date().toISOString(),
    };

    // Increase stock for returned items
    for (const product of newReturn.products) {
        const productIndex = data.products.findIndex(p => p.id === product.productId);
        if (productIndex !== -1) {
            const stockBefore = data.products[productIndex].stock;
            const stockAfter = stockBefore + product.quantity;
            data.products[productIndex].stock = stockAfter;

             data.stockMovements.push({
                id: `sm_${Date.now()}`,
                productId: product.productId,
                referenceId: newReturn.id,
                type: 'Retur',
                quantityChange: product.quantity,
                stockBefore: stockBefore,
                stockAfter: stockAfter,
                notes: `Retur dari No. Transaksi: ${newReturn.originalTransactionId}`,
                createdAt: new Date().toISOString(),
            });
        }
    }

    data.returns.push(newReturn);
    saveChanges();
    return Promise.resolve(newReturn);
}

export async function getStockOpnameMovements(startDate?: Date, endDate?: Date): Promise<(StockMovement & { productCode: string, productName: string })[]> {
    if (!startDate || !endDate) return [];
    
    const movements = data.stockMovements
        .filter(m => {
            const movementDate = new Date(m.createdAt);
            return m.type === 'Stok Opname' && movementDate >= startDate && movementDate <= endDate;
        })
        .map(m => {
            const product = data.products.find(p => p.id === m.productId);
            return {
                ...m,
                productCode: product?.code || 'N/A',
                productName: product?.name || 'N/A',
            };
        })
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
    return Promise.resolve(movements);
}

// --- Financial Account Functions ---
export async function getAccounts(): Promise<Account[]> {
    const accountsWithBalance = data.accounts.map(acc => {
        const balance = data.financialTransactions.reduce((bal, tx) => {
            if (tx.accountId === acc.id) {
                return tx.type === 'in' ? bal + tx.amount : bal - tx.amount;
            }
            return bal;
        }, 0);
        return { ...acc, balance };
    });
    return Promise.resolve(accountsWithBalance);
}

export async function addAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'balance'> & {balance?: number}): Promise<Account> {
    const newAccount: Account = { ...accountData, id: `acc_${Date.now()}`, createdAt: new Date().toISOString(), balance: 0 };
    data.accounts.push(newAccount);

    if (accountData.balance && accountData.balance > 0) {
        await addFinancialTransaction({
            accountId: newAccount.id,
            type: 'in',
            amount: accountData.balance,
            category: 'Saldo Awal',
            description: `Saldo awal untuk akun ${newAccount.name}`,
            transactionDate: new Date().toISOString().split('T')[0],
        });
    }

    saveChanges();
    return Promise.resolve(newAccount);
}

export async function updateAccount(id: string, accountUpdate: Partial<Omit<Account, 'id' | 'createdAt' | 'balance'>>): Promise<Account> {
    const index = data.accounts.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Account not found");
    data.accounts[index] = { ...data.accounts[index], ...accountUpdate };
    saveChanges();
    return Promise.resolve(data.accounts[index]);
}

export async function deleteAccount(id: string): Promise<void> {
    const hasTransactions = data.financialTransactions.some(tx => tx.accountId === id);
    if (hasTransactions) {
        throw new Error("Cannot delete account with existing transactions");
    }
    data.accounts = data.accounts.filter(a => a.id !== id);
    saveChanges();
    return Promise.resolve();
}


// --- Financial Transaction Functions ---
export async function getFinancialTransactions(type?: 'in' | 'out', startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    let filtered = data.financialTransactions;

    if (type) {
        filtered = filtered.filter(tx => tx.type === type);
    }
    if (startDate) {
        filtered = filtered.filter(tx => tx.transactionDate >= startDate);
    }
    if (endDate) {
        filtered = filtered.filter(tx => tx.transactionDate <= endDate);
    }

    const result = filtered.map(tx => ({
        ...tx,
        account: {
            name: data.accounts.find(a => a.id === tx.accountId)?.name || 'Unknown'
        }
    })).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return Promise.resolve(result);
}


export async function addFinancialTransaction(txData: Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>): Promise<FinancialTransaction> {
    const newTx: FinancialTransaction = { ...txData, id: `ft_${Date.now()}`, createdAt: new Date().toISOString(), account: { name: '' } };
    data.financialTransactions.push(newTx);
    saveChanges();
    return Promise.resolve(newTx);
}

export async function updateFinancialTransaction(id: string, txUpdate: Partial<Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>>): Promise<FinancialTransaction> {
    const index = data.financialTransactions.findIndex(tx => tx.id === id);
    if (index === -1) throw new Error("Transaction not found");
    data.financialTransactions[index] = { ...data.financialTransactions[index], ...txUpdate } as FinancialTransaction;
    saveChanges();
    return Promise.resolve(data.financialTransactions[index]);
}

export async function deleteFinancialTransaction(id: string): Promise<void> {
    const txToDelete = data.financialTransactions.find(tx => tx.id === id);
    if (!txToDelete) throw new Error("Transaction not found");

    if (txToDelete.referenceId) {
        throw new Error("Cannot delete transactions that are linked to sales or purchases.");
    }

    data.financialTransactions = data.financialTransactions.filter(tx => tx.id !== id);
    saveChanges();
    return Promise.resolve();
}

export async function addInternalTransfer(transferData: Transfer): Promise<{ message: string }> {
    const transferId = `trf_${Date.now()}`;
    await addFinancialTransaction({
        accountId: transferData.fromAccountId,
        type: 'out',
        amount: transferData.amount,
        category: 'Transfer Keluar',
        description: transferData.description,
        transactionDate: transferData.transferDate.toISOString().split('T')[0],
        referenceId: transferId
    });
    await addFinancialTransaction({
        accountId: transferData.toAccountId,
        type: 'in',
        amount: transferData.amount,
        category: 'Transfer Masuk',
        description: transferData.description,
        transactionDate: transferData.transferDate.toISOString().split('T')[0],
        referenceId: transferId
    });
    return Promise.resolve({ message: "Transfer successful" });
}


// --- Report Functions ---
export async function getSalesProfitReport(startDate: Date, endDate: Date): Promise<SalesProfitReportData> {
    const deliveredShipments = data.shipments.filter(s => {
        const shipmentDate = new Date(s.createdAt);
        return s.status === 'Terkirim' && shipmentDate >= startDate && shipmentDate <= endDate;
    });

    let totalRevenue = 0;
    let totalCOGS = 0;
    const transactionDetails = deliveredShipments.map(shipment => {
        const cogs = shipment.products.reduce((sum, p) => sum + (p.costPrice || 0) * p.quantity, 0);
        const profit = shipment.totalRevenue - cogs;
        
        totalRevenue += shipment.totalRevenue;
        totalCOGS += cogs;

        return {
            id: shipment.id,
            transactionId: shipment.transactionId,
            createdAt: shipment.createdAt,
            customerName: shipment.customerName,
            totalRevenue: shipment.totalRevenue,
            totalCOGS: cogs,
            profit: profit,
        };
    });
    
    const grossProfit = totalRevenue - totalCOGS;

    const expenses = data.financialTransactions.filter(tx => {
        const txDate = new Date(tx.transactionDate);
        return tx.type === 'out' 
            && tx.category !== 'Pembelian Stok'
            && txDate >= startDate 
            && txDate <= endDate;
    });

    const operationalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
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

// --- Payment Functions ---
export async function payReceivable(shipmentId: string, accountId: string, paidAt: Date): Promise<void> {
    const index = data.shipments.findIndex(s => s.id === shipmentId);
    if (index === -1) throw new Error("Shipment not found");
    if (data.shipments[index].paymentStatus === 'Lunas') throw new Error("This shipment has already been paid");

    data.shipments[index].paymentStatus = 'Lunas';
    data.shipments[index].paidAt = paidAt.toISOString();

    await addFinancialTransaction({
        accountId,
        type: 'in',
        amount: data.shipments[index].totalAmount,
        category: 'Penerimaan Piutang',
        description: `Penerimaan pembayaran untuk ${data.shipments[index].transactionId} dari ${data.shipments[index].customerName}`,
        transactionDate: paidAt.toISOString().split('T')[0],
        referenceId: shipmentId,
    });
    
    return Promise.resolve();
}

export async function payPayable(purchaseId: string, accountId: string, paidAt: Date): Promise<void> {
    const index = data.purchases.findIndex(p => p.id === purchaseId);
    if (index === -1) throw new Error("Purchase not found");
    if (data.purchases[index].paymentStatus === 'Lunas') throw new Error("This purchase has already been paid");

    data.purchases[index].paymentStatus = 'Lunas';
    data.purchases[index].paidAt = paidAt.toISOString();
    data.purchases[index].accountId = accountId;

     await addFinancialTransaction({
        accountId,
        type: 'out',
        amount: data.purchases[index].totalAmount,
        category: 'Pelunasan Utang',
        description: `Pembayaran utang untuk pembelian ${data.purchases[index].purchaseNumber} dari ${data.purchases[index].supplierName}`,
        transactionDate: paidAt.toISOString().split('T')[0],
        referenceId: purchaseId,
    });

    return Promise.resolve();
}
