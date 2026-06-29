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
} from './types';

/**
 * @fileOverview Fungsi bridge untuk memanggil API backend (Neon DB).
 */

async function apiFetch(endpoint: string, options?: RequestInit) {
    const res = await fetch(endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Gagal memproses permintaan' }));
        throw new Error(error.message || 'Terjadi kesalahan pada server');
    }
    return res.json();
}

// USERS
export async function getUsers(): Promise<User[]> {
    return apiFetch('/api/users');
}
export async function addUser(user: Omit<User, 'id'>): Promise<User> {
    return apiFetch('/api/users', { method: 'POST', body: JSON.stringify(user) });
}
export async function updateUser(id: string, user: Partial<User>): Promise<User> {
    return apiFetch(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(user) });
}
export async function deleteUser(id: string): Promise<{ id: string }> {
    return apiFetch(`/api/users/${id}`, { method: 'DELETE' });
}

// SHIPMENTS (PESANAN)
export async function getShipments(): Promise<Shipment[]> {
    return apiFetch('/api/shipments');
}
export async function addShipment(shipment: Omit<Shipment, 'id' | 'createdAt' | 'status'>): Promise<Shipment> {
    return apiFetch('/api/shipments', { method: 'POST', body: JSON.stringify(shipment) });
}
export async function updateShipment(id: string, shipment: Partial<Shipment>): Promise<Shipment> {
    return apiFetch(`/api/shipments/${id}`, { method: 'PATCH', body: JSON.stringify(shipment) });
}
export async function deleteShipment(id: string): Promise<{ id: string }> {
    return apiFetch(`/api/shipments/${id}`, { method: 'DELETE' });
}

// ALUR KERJA PENJAHIT (TAWARAN)
export async function offerShipmentsToTailors(shipmentIds: string[], users: User[]): Promise<{ count: number }> {
    return apiFetch('/api/shipments/offer', { method: 'POST', body: JSON.stringify({ shipmentIds, users }) });
}
export async function acceptShipments(shipmentIds: string[]): Promise<{ count: number }> {
    return apiFetch('/api/shipments/accept', { method: 'POST', body: JSON.stringify({ shipmentIds }) });
}
export async function rejectShipments(shipmentIds: string[]): Promise<{ count: number }> {
    return apiFetch('/api/shipments/reject', { method: 'POST', body: JSON.stringify({ shipmentIds }) });
}
export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<{ count: number }> {
    return apiFetch('/api/shipments/deliver', { method: 'POST', body: JSON.stringify({ shipmentIds }) });
}

// CUSTOMERS
export async function getCustomers(): Promise<Customer[]> {
    return apiFetch('/api/customers');
}
export async function addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    return apiFetch('/api/customers', { method: 'POST', body: JSON.stringify(customer) });
}
export async function updateCustomer(id: string, customer: Omit<Customer, 'id'>): Promise<Customer> {
    return apiFetch(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(customer) });
}
export async function deleteCustomer(id: string): Promise<{ id: string }> {
    return apiFetch(`/api/customers/${id}`, { method: 'DELETE' });
}

// SUPPLIERS
export async function getSuppliers(): Promise<Supplier[]> {
    return apiFetch('/api/suppliers');
}
export async function addSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    return apiFetch('/api/suppliers', { method: 'POST', body: JSON.stringify(supplier) });
}
export async function updateSupplier(id: string, supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    return apiFetch(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(supplier) });
}
export async function deleteSupplier(id: string): Promise<{ id: string }> {
    return apiFetch(`/api/suppliers/${id}`, { method: 'DELETE' });
}

// PRODUCTS (MASTER JAHITAN)
export async function getProducts(): Promise<Product[]> {
    return apiFetch('/api/products');
}
export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    return apiFetch('/api/products', { method: 'POST', body: JSON.stringify(productData) });
}
export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    return apiFetch(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(productData) });
}
export async function deleteMultipleProducts(ids: string[]): Promise<{ ids: string[] }> {
    return apiFetch('/api/products', { method: 'DELETE', body: JSON.stringify({ ids }) });
}
export async function initializeMasterData(): Promise<any> {
    return apiFetch('/api/products/seed', { method: 'POST' });
}

// STOK
export async function getStockMovements(productId: string): Promise<StockMovement[]> {
    return apiFetch(`/api/stock-movements?productId=${productId}`);
}
export async function updateProductStock(productId: string, physicalStock: number, notes: string): Promise<Product> {
    return apiFetch('/api/stock-movements/opname', { method: 'POST', body: JSON.stringify({ productId, physicalStock, notes }) });
}

// ACCOUNTS
export async function getAccounts(): Promise<Account[]> {
    return apiFetch('/api/accounts');
}
export async function addAccount(account: Omit<Account, 'id' | 'createdAt' | 'balance'> & { balance?: number }): Promise<Account> {
    return apiFetch('/api/accounts', { method: 'POST', body: JSON.stringify(account) });
}
export async function updateAccount(id: string, account: Partial<Omit<Account, 'id' | 'balance'>>): Promise<Account> {
    return apiFetch(`/api/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(account) });
}
export async function deleteAccount(id: string): Promise<{ id: string }> {
    return apiFetch(`/api/accounts/${id}`, { method: 'DELETE' });
}

// TRANSAKSI KEUANGAN
export async function getFinancialTransactions(accountId?: string, startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    const params = new URLSearchParams();
    if (accountId) params.append('accountId', accountId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiFetch(`/api/financial-transactions?${params.toString()}`);
}
export async function addFinancialTransaction(transaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>): Promise<FinancialTransaction> {
    return apiFetch('/api/financial-transactions', { method: 'POST', body: JSON.stringify(transaction) });
}
export async function updateFinancialTransaction(id: string, transaction: Partial<Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>>): Promise<FinancialTransaction> {
    return apiFetch(`/api/financial-transactions/${id}`, { method: 'PATCH', body: JSON.stringify(transaction) });
}
export async function deleteFinancialTransaction(id: string): Promise<{ id: string }> {
    return apiFetch(`/api/financial-transactions/${id}`, { method: 'DELETE' });
}
export async function addInternalTransfer(transfer: Transfer): Promise<any> {
    return apiFetch('/api/financial-transactions/transfer', { method: 'POST', body: JSON.stringify(transfer) });
}

// PENJUALAN LANGSUNG (KASIR)
export async function processDirectSale(user: User, customerId: string, cart: any[], accountId: string, paymentStatus: 'Lunas' | 'Belum Lunas'): Promise<Shipment> {
    return apiFetch('/api/shipments/direct-sale', { method: 'POST', body: JSON.stringify({ user, customerId, cart, accountId, paymentStatus }) });
}

// PEMBELIAN & HUTANG
export async function getPurchases(): Promise<Purchase[]> {
    return apiFetch('/api/purchases');
}
export async function addPurchase(purchase: any): Promise<Purchase> {
    return apiFetch('/api/purchases', { method: 'POST', body: JSON.stringify(purchase) });
}
export async function payPayable(purchaseId: string, accountId: string, paidAt: Date): Promise<Purchase> {
    return apiFetch('/api/purchases/pay', { method: 'POST', body: JSON.stringify({ purchaseId, accountId, paidAt }) });
}

// RETUR
export async function getReturns(): Promise<Return[]> {
    return apiFetch('/api/returns');
}
export async function addReturn(retur: any): Promise<Return> {
    return apiFetch('/api/returns', { method: 'POST', body: JSON.stringify(retur) });
}

// PELUNASAN (TRANSAKSI PAGE)
export async function payReceivable(shipmentId: string, accountId: string, paidAt: Date): Promise<Shipment> {
    return apiFetch('/api/shipments/pay', { method: 'POST', body: JSON.stringify({ shipmentId, accountId, paidAt }) });
}

// LAPORAN
export async function getSalesProfitReport(startDate: Date, endDate: Date, userId: string): Promise<SalesProfitReportData> {
    return apiFetch(`/api/reports/sales-profit?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&userId=${userId}`);
}
