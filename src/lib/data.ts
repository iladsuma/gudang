

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
import initialData from '../../db.json';


// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// =================================
// User Functions
// =================================
export async function getUsers(): Promise<User[]> {
    return Promise.resolve(initialData.users || []);
}

export async function addUser(user: Omit<User, 'id'>): Promise<User> {
    // This is a mock function and will not persist data.
    console.log('Adding user:', user);
    const newUser: User = { ...user, id: `usr_${Date.now()}` };
    return Promise.resolve(newUser);
}

export async function updateUser(id: string, user: Partial<User>): Promise<User> {
     // This is a mock function and will not persist data.
    console.log('Updating user:', id, user);
    const updatedUser: User = { id, username: user.username!, role: user.role! };
    return Promise.resolve(updatedUser);
}

export async function deleteUser(id: string): Promise<{ id: string }> {
    // This is a mock function and will not persist data.
    console.log('Deleting user:', id);
    return Promise.resolve({ id });
}


// =================================
// Shipment Functions
// =================================
export async function getShipments(): Promise<Shipment[]> {
    return Promise.resolve(initialData.shipments || []);
}

export async function addShipment(shipment: Omit<Shipment, 'id' | 'createdAt' | 'status'>): Promise<Shipment> {
    // This is a mock function and will not persist data.
     const newShipment = { 
        ...shipment, 
        id: `ship_${Date.now()}`, 
        status: 'Proses' as const,
        createdAt: new Date().toISOString()
    };
    console.log('Adding shipment:', newShipment);
    return Promise.resolve(newShipment);
}

export async function updateShipment(id: string, shipment: Partial<Shipment>): Promise<Shipment> {
    // This is a mock function and will not persist data.
    console.log('Updating shipment:', id, shipment);
    const updatedShipment: Shipment = { ...shipment as Shipment, id };
    return Promise.resolve(updatedShipment);
}


export async function deleteShipment(id: string): Promise<{ id: string }> {
    // This is a mock function and will not persist data.
    console.log('Deleting shipment:', id);
    return Promise.resolve({ id });
}

export async function processShipmentsToPackaging(shipmentIds: string[], user: User | null): Promise<{ count: number }> {
    // This is a mock function and will not persist data.
    if (!user) throw new Error("User must be logged in.");
    console.log('Processing to packaging:', shipmentIds);
    return Promise.resolve({ count: shipmentIds.length });
}

export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<{ count: number }> {
    // This is a mock function and will not persist data.
    console.log('Processing to delivered:', shipmentIds);
    return Promise.resolve({ count: shipmentIds.length });
}

// =================================
// Settings Functions (Expedition, Packaging, Customer, Supplier, Products)
// =================================
export async function getExpeditions(): Promise<Expedition[]> {
    return Promise.resolve(initialData.expeditions || []);
}
export async function addExpedition(name: string): Promise<Expedition> {
    const newExpedition = { id: `exp_${Date.now()}`, name };
    console.log('Adding expedition', newExpedition);
    return Promise.resolve(newExpedition);
}
export async function updateExpedition(id: string, name: string): Promise<Expedition> {
    const updatedExpedition = { id, name };
    console.log('Updating expedition', updatedExpedition);
    return Promise.resolve(updatedExpedition);
}
export async function deleteExpedition(id: string): Promise<{ id: string }> {
    console.log('Deleting expedition', id);
    return Promise.resolve({ id });
}

export async function getPackagingOptions(): Promise<Packaging[]> {
    return Promise.resolve(initialData.packagingOptions || []);
}
export async function addPackagingOption(option: Omit<Packaging, 'id'>): Promise<Packaging> {
    const newOption = { ...option, id: `pkg_${Date.now()}` };
    console.log('Adding packaging option', newOption);
    return Promise.resolve(newOption);
}
export async function updatePackagingOption(id: string, option: Omit<Packaging, 'id'>): Promise<Packaging> {
    const updatedOption = { ...option, id };
    console.log('Updating packaging option', updatedOption);
    return Promise.resolve(updatedOption);
}
export async function deletePackagingOption(id: string): Promise<{ id: string }> {
    console.log('Deleting packaging option', id);
    return Promise.resolve({ id });
}

export async function getCustomers(): Promise<Customer[]> {
    return Promise.resolve(initialData.customers || []);
}
export async function addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const newCustomer = { ...customer, id: `cust_${Date.now()}` };
    console.log('Adding customer', newCustomer);
    return Promise.resolve(newCustomer);
}
export async function updateCustomer(id: string, customer: Omit<Customer, 'id'>): Promise<Customer> {
    const updatedCustomer = { ...customer, id };
    console.log('Updating customer', updatedCustomer);
    return Promise.resolve(updatedCustomer);
}
export async function deleteCustomer(id: string): Promise<{ id: string }> {
    console.log('Deleting customer', id);
    return Promise.resolve({ id });
}

export async function getSuppliers(): Promise<Supplier[]> {
    return Promise.resolve(initialData.suppliers || []);
}
export async function addSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const newSupplier = { ...supplier, id: `sup_${Date.now()}` };
    console.log('Adding supplier', newSupplier);
    return Promise.resolve(newSupplier);
}
export async function updateSupplier(id: string, supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const updatedSupplier = { ...supplier, id };
    console.log('Updating supplier', updatedSupplier);
    return Promise.resolve(updatedSupplier);
}
export async function deleteSupplier(id: string): Promise<{ id: string }> {
    console.log('Deleting supplier', id);
    return Promise.resolve({ id });
}


// =================================
// Product Functions
// =================================

export async function getProducts(): Promise<Product[]> {
    return Promise.resolve(initialData.products || []);
}

export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const newProduct = { ...productData, id: `prod_${Date.now()}` };
    console.log('Adding product', newProduct);
    return Promise.resolve(newProduct);
}

export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const updatedProduct = { ...productData, id } as Product;
    console.log('Updating product', updatedProduct);
    return Promise.resolve(updatedProduct);
}


export async function deleteMultipleProducts(ids: string[]): Promise<{ ids: string[] }> {
    console.log('Deleting products', ids);
    return Promise.resolve({ ids });
}

// =================================
// Stock Functions
// =================================

export async function getStockMovements(productId: string): Promise<StockMovement[]> {
    console.log('Getting stock movements for', productId);
    return Promise.resolve([]); // Mock response
}

export async function updateProductStock(productId: string, physicalStock: number, notes: string): Promise<Product> {
    console.log('Updating stock for', productId, physicalStock, notes);
    const mockProduct: Product = {
        id: productId,
        stock: physicalStock,
        code: 'PROD-001',
        name: 'Mock Product',
        price: 100,
        costPrice: 50,
        minStock: 10,
        unit: 'PCS',
        category: 'Mock',
        imageUrl: '',
    };
    return Promise.resolve(mockProduct);
}

export async function bulkUpdateProductStock(updates: { code: string; physicalStock: number; notes: string }[]): Promise<{ success: number; failure: number }> {
    console.log('Bulk updating stock', updates);
    return Promise.resolve({ success: updates.length, failure: 0 });
}

// =================================
// Financial Functions (Accounts, Transactions)
// =================================

export async function getAccounts(): Promise<Account[]> {
    return Promise.resolve(initialData.accounts || []);
}
export async function addAccount(account: Omit<Account, 'id' | 'createdAt' | 'balance'> & { balance?: number }): Promise<Account> {
    const newAccount = { ...account, id: `acc_${Date.now()}`, createdAt: new Date().toISOString(), balance: account.balance || 0 };
    console.log('Adding account', newAccount);
    return Promise.resolve(newAccount);
}
export async function updateAccount(id: string, account: Partial<Omit<Account, 'id' | 'balance'>>): Promise<Account> {
    const updatedAccount = { ...account, id, type: account.type!, name: account.name!, balance: 1000 } as Account;
    console.log('Updating account', updatedAccount);
    return Promise.resolve(updatedAccount);
}
export async function deleteAccount(id: string): Promise<{ id: string }> {
    console.log('Deleting account', id);
    return Promise.resolve({ id });
}


export async function getFinancialTransactions(accountId?: string, startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    const transactions = initialData.financialTransactions.map(t => ({
        ...t,
        account: { name: initialData.accounts.find(a => a.id === t.accountId)?.name || 'N/A' }
    })) as unknown as FinancialTransaction[];

    return Promise.resolve(transactions || []);
}

export async function addFinancialTransaction(transaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>): Promise<FinancialTransaction> {
    const newTx = { ...transaction, id: `ft_${Date.now()}`, createdAt: new Date().toISOString(), account: { name: 'Mock' } };
     console.log('Adding financial transaction', newTx);
    return Promise.resolve(newTx);
}

export async function updateFinancialTransaction(id: string, transaction: Partial<Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>>): Promise<FinancialTransaction> {
     const updatedTx = { ...transaction, id, account: { name: 'Mock' } } as FinancialTransaction;
     console.log('Updating financial transaction', updatedTx);
    return Promise.resolve(updatedTx);
}

export async function deleteFinancialTransaction(id: string): Promise<{ id: string }> {
     console.log('Deleting financial transaction', id);
    return Promise.resolve({ id });
}

export async function addInternalTransfer(transfer: Transfer): Promise<any> {
    console.log('Adding internal transfer', transfer);
    return Promise.resolve({ message: "Transfer successful" });
}

// =================================
// Sales & Purchase Functions
// =================================

export async function processDirectSale(user: User, customerId: string, cart: any[], accountId: string, paymentStatus: 'Lunas' | 'Belum Lunas'): Promise<Shipment> {
    const newShipment = { id: `ship_${Date.now()}`, userId: user.id, customerId, products: cart, accountId, paymentStatus } as Shipment;
    console.log('Processing direct sale', newShipment);
    return Promise.resolve(newShipment);
}

export async function getPurchases(): Promise<Purchase[]> {
    return Promise.resolve(initialData.purchases || []);
}

export async function addPurchase(purchase: any): Promise<Purchase> {
    const newPurchase = { ...purchase, id: `purch_${Date.now()}`};
    console.log('Adding purchase', newPurchase);
    return Promise.resolve(newPurchase);
}

export async function getReturns(): Promise<Return[]> {
    return Promise.resolve(initialData.returns || []);
}

export async function addReturn(retur: any): Promise<Return> {
    const newReturn = { ...retur, id: `ret_${Date.now()}`};
    console.log('Adding return', newReturn);
    return Promise.resolve(newReturn);
}

// =================================
// Payables & Receivables Functions
// =================================

export async function payPayable(purchaseId: string, accountId: string, paidAt: Date): Promise<Purchase> {
     const mockPurchase = { id: purchaseId, paymentStatus: 'Lunas', accountId } as Purchase;
     console.log('Paying payable', mockPurchase);
    return Promise.resolve(mockPurchase);
}

export async function payReceivable(shipmentId: string, accountId: string, paidAt: Date): Promise<Shipment> {
    const mockShipment = { id: shipmentId, paymentStatus: 'Lunas', accountId } as Shipment;
    console.log('Paying receivable', mockShipment);
    return Promise.resolve(mockShipment);
}

// =================================
// Report Functions
// =================================

export async function getSalesProfitReport(startDate: Date, endDate: Date, userId: string): Promise<SalesProfitReportData> {
    console.log('Getting sales profit report', startDate, endDate, userId);
    const mockReport: SalesProfitReportData = {
        totalRevenue: 0,
        totalCOGS: 0,
        grossProfit: 0,
        operationalExpenses: 0,
        netProfit: 0,
        transactionDetails: [],
    };
    return Promise.resolve(mockReport);
}


export async function getStockOpnameMovements(startDate?: Date, endDate?: Date): Promise<(StockMovement & { productCode: string, productName: string })[]> {
     if (!startDate || !endDate) return [];
    console.log('Getting stock opname movements', startDate, endDate);
    return Promise.resolve([]);
}
