
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
    Transfer
} from './types';

// Use a base URL for the API to make it easier to change if the port or domain changes.
// In a real production environment, this would come from an environment variable.
const API_BASE_URL = '/api'; 

/**
 * A helper function to handle API responses, parse JSON, and throw errors for non-ok responses.
 * @param response The Fetch API Response object.
 * @returns The JSON data from the response.
 * @throws An error with a message from the server if the response is not ok.
 */
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
    const response = await fetch(`${API_BASE_URL}/users`);
    return handleResponse<User[]>(response);
}

export async function addUser(user: Omit<User, 'id'>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
    });
    return handleResponse<User>(response);
}

export async function updateUser(id: string, user: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
    });
    return handleResponse<User>(response);
}

export async function deleteUser(id: string): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
    return handleResponse<{ id: string }>(response);
}


// =================================
// Shipment Functions
// =================================
export async function getShipments(): Promise<Shipment[]> {
    const response = await fetch(`${API_BASE_URL}/shipments`);
    return handleResponse<Shipment[]>(response);
}

export async function addShipment(shipment: Omit<Shipment, 'id' | 'createdAt' | 'status'>): Promise<Shipment> {
    const response = await fetch(`${API_BASE_URL}/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipment),
    });
    return handleResponse<Shipment>(response);
}

export async function updateShipment(id: string, shipment: Partial<Shipment>): Promise<Shipment> {
    const response = await fetch(`${API_BASE_URL}/shipments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipment),
    });
    return handleResponse<Shipment>(response);
}


export async function deleteShipment(id: string): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/shipments/${id}`, { method: 'DELETE' });
    return handleResponse<{ id: string }>(response);
}

export async function processShipmentsToPackaging(shipmentIds: string[], user: User | null): Promise<{ count: number }> {
    const response = await fetch(`${API_BASE_URL}/shipments/process-to-packaging`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds, user }),
    });
    return handleResponse<{ count: number }>(response);
}

export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<{ count: number }> {
    const response = await fetch(`${API_BASE_URL}/shipments/process-to-delivered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds }),
    });
    return handleResponse<{ count: number }>(response);
}

// =================================
// Settings Functions (Expedition, Packaging, Customer, Supplier, Products)
// =================================
export async function getExpeditions(): Promise<Expedition[]> {
    const response = await fetch(`${API_BASE_URL}/expeditions`);
    return handleResponse<Expedition[]>(response);
}
export async function addExpedition(name: string): Promise<Expedition> {
    const response = await fetch(`${API_BASE_URL}/expeditions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    return handleResponse<Expedition>(response);
}
export async function updateExpedition(id: string, name: string): Promise<Expedition> {
    const response = await fetch(`${API_BASE_URL}/expeditions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    return handleResponse<Expedition>(response);
}
export async function deleteExpedition(id: string): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/expeditions/${id}`, { method: 'DELETE' });
    return handleResponse<{ id: string }>(response);
}

export async function getPackagingOptions(): Promise<Packaging[]> {
    const response = await fetch(`${API_BASE_URL}/packaging`);
    return handleResponse<Packaging[]>(response);
}
export async function addPackagingOption(option: Omit<Packaging, 'id'>): Promise<Packaging> {
    const response = await fetch(`${API_BASE_URL}/packaging`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(option) });
    return handleResponse<Packaging>(response);
}
export async function updatePackagingOption(id: string, option: Omit<Packaging, 'id'>): Promise<Packaging> {
    const response = await fetch(`${API_BASE_URL}/packaging/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(option) });
    return handleResponse<Packaging>(response);
}
export async function deletePackagingOption(id: string): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/packaging/${id}`, { method: 'DELETE' });
    return handleResponse<{ id: string }>(response);
}

export async function getCustomers(): Promise<Customer[]> {
    const response = await fetch(`${API_BASE_URL}/customers`);
    return handleResponse<Customer[]>(response);
}
export async function addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customer) });
    return handleResponse<Customer>(response);
}
export async function updateCustomer(id: string, customer: Omit<Customer, 'id'>): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customer) });
    return handleResponse<Customer>(response);
}
export async function deleteCustomer(id: string): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, { method: 'DELETE' });
    return handleResponse<{ id: string }>(response);
}

export async function getSuppliers(): Promise<Supplier[]> {
    const response = await fetch(`${API_BASE_URL}/suppliers`);
    return handleResponse<Supplier[]>(response);
}
export async function addSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const response = await fetch(`${API_BASE_URL}/suppliers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(supplier) });
    return handleResponse<Supplier>(response);
}
export async function updateSupplier(id: string, supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(supplier) });
    return handleResponse<Supplier>(response);
}
export async function deleteSupplier(id: string): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, { method: 'DELETE' });
    return handleResponse<{ id: string }>(response);
}


// =================================
// Product Functions
// =================================

export async function getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products`);
    return handleResponse<Product[]>(response);
}

export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
    });
    return handleResponse<Product>(response);
}

export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
    });
    return handleResponse<Product>(response);
}


export async function deleteMultipleProducts(ids: string[]): Promise<{ ids: string[] }> {
    const response = await fetch(`${API_BASE_URL}/products`, {
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
    const response = await fetch(`${API_BASE_URL}/stock-movements?productId=${productId}`);
    return handleResponse<StockMovement[]>(response);
}

export async function updateProductStock(productId: string, physicalStock: number, notes: string): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/stock-movements/opname`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, physicalStock, notes }),
    });
    return handleResponse<Product>(response);
}

export async function bulkUpdateProductStock(updates: { code: string; physicalStock: number; notes: string }[]): Promise<{ success: number; failure: number }> {
    const response = await fetch(`${API_BASE_URL}/stock-movements/bulk-opname`, {
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
    const response = await fetch(`${API_BASE_URL}/accounts`);
    return handleResponse<Account[]>(response);
}
export async function addAccount(account: Omit<Account, 'id' | 'createdAt' | 'balance'> & { balance?: number }): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(account) });
    return handleResponse<Account>(response);
}
export async function updateAccount(id: string, account: Partial<Omit<Account, 'id' | 'balance'>>): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(account) });
    return handleResponse<Account>(response);
}
export async function deleteAccount(id: string): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, { method: 'DELETE' });
    return handleResponse<{ id: string }>(response);
}


export async function getFinancialTransactions(accountId?: string, startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    const params = new URLSearchParams();
    if(accountId) params.append('accountId', accountId);
    if(startDate) params.append('startDate', startDate);
    if(endDate) params.append('endDate', endDate);
    
    const response = await fetch(`${API_BASE_URL}/financial-transactions?${params.toString()}`);
    return handleResponse<FinancialTransaction[]>(response);
}

export async function addFinancialTransaction(transaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>): Promise<FinancialTransaction> {
    const response = await fetch(`${API_BASE_URL}/financial-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
    });
    return handleResponse<FinancialTransaction>(response);
}

export async function updateFinancialTransaction(id: string, transaction: Partial<Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>>): Promise<FinancialTransaction> {
    const response = await fetch(`${API_BASE_URL}/financial-transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
    });
    return handleResponse<FinancialTransaction>(response);
}

export async function deleteFinancialTransaction(id: string): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/financial-transactions/${id}`, { method: 'DELETE' });
    return handleResponse<{ id: string }>(response);
}

export async function addInternalTransfer(transfer: Transfer): Promise<any> {
     const response = await fetch(`${API_BASE_URL}/financial-transactions/internal-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transfer),
    });
    return handleResponse<any>(response);
}

// =================================
// Sales & Purchase Functions
// =================================

export async function processDirectSale(user: User, customerId: string, cart: any[], accountId: string, paymentStatus: 'Lunas' | 'Belum Lunas') {
    const response = await fetch(`${API_BASE_URL}/sales/direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, customerId, cart, accountId, paymentStatus }),
    });
    return handleResponse<Shipment>(response);
}

export async function getPurchases(): Promise<Purchase[]> {
    const response = await fetch(`${API_BASE_URL}/purchases`);
    return handleResponse<Purchase[]>(response);
}

export async function addPurchase(purchase: any): Promise<Purchase> {
    const response = await fetch(`${API_BASE_URL}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchase),
    });
    return handleResponse<Purchase>(response);
}

export async function getReturns(): Promise<Return[]> {
    const response = await fetch(`${API_BASE_URL}/returns`);
    return handleResponse<Return[]>(response);
}

export async function addReturn(retur: any): Promise<Return> {
    const response = await fetch(`${API_BASE_URL}/returns`, {
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
    const response = await fetch(`${API_BASE_URL}/payables/${purchaseId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, paidAt: paidAt.toISOString() }),
    });
    return handleResponse<Purchase>(response);
}

export async function payReceivable(shipmentId: string, accountId: string, paidAt: Date): Promise<Shipment> {
    const response = await fetch(`${API_BASE_URL}/receivables/${shipmentId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, paidAt: paidAt.toISOString() }),
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
    const response = await fetch(`${API_BASE_URL}/reports/sales-profit?${params.toString()}`);
    return handleResponse<SalesProfitReportData>(response);
}
