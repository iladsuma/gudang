
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
    const response = await fetch('/api/shipments', { cache: 'no-store' });
    return handleResponse<Shipment[]>(response);
}

export async function addShipment(shipment: Omit<Shipment, 'id' | 'createdAt' | 'status'>): Promise<Shipment> {
    const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipment),
    });
    return handleResponse<Shipment>(response);
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
    const response = await fetch('/api/customers', { cache: 'no-store' });
    return handleResponse<Customer[]>(response);
}
export async function addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
    });
    return handleResponse<Customer>(response);
}
export async function updateCustomer(id: string, customer: Omit<Customer, 'id'>): Promise<Customer> {
     const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
    });
    return handleResponse<Customer>(response);
}
export async function deleteCustomer(id: string): Promise<{ id: string }> {
     const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
    });
    return handleResponse<{ id: string }>(response);
}

export async function getSuppliers(): Promise<Supplier[]> {
    const response = await fetch('/api/suppliers', { cache: 'no-store' });
    return handleResponse<Supplier[]>(response);
}
export async function addSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
     const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier),
    });
    return handleResponse<Supplier>(response);
}
export async function updateSupplier(id: string, supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
     const response = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier),
    });
    return handleResponse<Supplier>(response);
}
export async function deleteSupplier(id: string): Promise<{ id: string }> {
     const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
    });
    return handleResponse<{ id: string }>(response);
}


// =================================
// Product Functions
// =================================

export async function getProducts(): Promise<Product[]> {
    const response = await fetch('/api/products', { cache: 'no-store' });
    return handleResponse<Product[]>(response);
}

export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
    });
    return handleResponse<Product>(response);
}

export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
    });
    return handleResponse<Product>(response);
}


export async function deleteMultipleProducts(ids: string[]): Promise<{ ids: string[] }> {
    const response = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    return handleResponse<{ ids: string[] }>(response);
}

// =================================
// Stock Functions
// =================================

export async function getStockMovements(productId: string): Promise<StockMovement[]> {
    const response = await fetch(`/api/stock-movements?productId=${productId}`, { cache: 'no-store' });
    return handleResponse<StockMovement[]>(response);
}

export async function updateProductStock(productId: string, physicalStock: number, notes: string): Promise<Product> {
    const response = await fetch(`/api/products/${productId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ physicalStock, notes }),
    });
    return handleResponse<Product>(response);
}

export async function bulkUpdateProductStock(updates: { code: string; physicalStock: number; notes: string }[]): Promise<{ success: number; failure: number }> {
    const response = await fetch('/api/products/bulk-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
    });
    return handleResponse<{ success: number; failure: number }>(response);
}

// =================================
// Financial Functions (Accounts, Transactions)
// =================================

export async function getAccounts(): Promise<Account[]> {
    const response = await fetch('/api/accounts', { cache: 'no-store' });
    return handleResponse<Account[]>(response);
}
export async function addAccount(account: Omit<Account, 'id' | 'createdAt' | 'balance'> & { balance?: number }): Promise<Account> {
    const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
    });
    return handleResponse<Account>(response);
}
export async function updateAccount(id: string, account: Partial<Omit<Account, 'id' | 'balance'>>): Promise<Account> {
     const response = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
    });
    return handleResponse<Account>(response);
}
export async function deleteAccount(id: string): Promise<{ id: string }> {
    const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
    });
    return handleResponse<{ id: string }>(response);
}


export async function getFinancialTransactions(accountId?: string, startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    const params = new URLSearchParams();
    if(accountId) params.append('accountId', accountId);
    if(startDate) params.append('startDate', startDate);
    if(endDate) params.append('endDate', endDate);
    
    const response = await fetch(`/api/financial-transactions?${params.toString()}`, { cache: 'no-store' });
    return handleResponse<FinancialTransaction[]>(response);
}

export async function addFinancialTransaction(transaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>): Promise<FinancialTransaction> {
    const response = await fetch('/api/financial-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
    });
    return handleResponse<FinancialTransaction>(response);
}

export async function updateFinancialTransaction(id: string, transaction: Partial<Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>>): Promise<FinancialTransaction> {
     const response = await fetch(`/api/financial-transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
    });
    return handleResponse<FinancialTransaction>(response);
}

export async function deleteFinancialTransaction(id: string): Promise<{ id: string }> {
     const response = await fetch(`/api/financial-transactions/${id}`, {
        method: 'DELETE',
    });
    return handleResponse<{ id: string }>(response);
}

export async function addInternalTransfer(transfer: Transfer): Promise<any> {
     const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transfer),
    });
    return handleResponse<any>(response);
}

// =================================
// Sales & Purchase Functions
// =================================

export async function processDirectSale(user: User, customerId: string, cart: any[], accountId: string, paymentStatus: 'Lunas' | 'Belum Lunas'): Promise<Shipment> {
    const response = await fetch('/api/sales/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, customerId, cart, accountId, paymentStatus }),
    });
    return handleResponse<Shipment>(response);
}

export async function getPurchases(): Promise<Purchase[]> {
    const response = await fetch('/api/purchases', { cache: 'no-store' });
    return handleResponse<Purchase[]>(response);
}

export async function addPurchase(purchase: any): Promise<Purchase> {
    const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchase),
    });
    return handleResponse<Purchase>(response);
}

export async function getReturns(): Promise<Return[]> {
    const response = await fetch('/api/returns', { cache: 'no-store' });
    return handleResponse<Return[]>(response);
}

export async function addReturn(retur: any): Promise<Return> {
    const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(retur),
    });
    return handleResponse<Return>(response);
}

// =================================
// Payables & Receivables Functions
// =================================

export async function payPayable(purchaseId: string, accountId: string, paidAt: Date): Promise<Purchase> {
     const response = await fetch(`/api/payables/${purchaseId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, paidAt }),
    });
    return handleResponse<Purchase>(response);
}

export async function payReceivable(shipmentId: string, accountId: string, paidAt: Date): Promise<Shipment> {
    const response = await fetch(`/api/receivables/${shipmentId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, paidAt }),
    });
    return handleResponse<Shipment>(response);
}

// =================================
// Report Functions
// =================================

export async function getSalesProfitReport(startDate: Date, endDate: Date, userId: string): Promise<SalesProfitReportData> {
    const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        userId,
    });
    const response = await fetch(`/api/reports/sales-profit?${params.toString()}`, { cache: 'no-store' });
    return handleResponse<SalesProfitReportData>(response);
}


export async function getStockOpnameMovements(startDate?: Date, endDate?: Date): Promise<(StockMovement & { productCode: string, productName: string })[]> {
     if (!startDate || !endDate) return [];
    console.log('Getting stock opname movements', startDate, endDate);
    return Promise.resolve([]);
}
