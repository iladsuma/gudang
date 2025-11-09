
'use client';

import type { User, Shipment, Checkout, Expedition, Product, Packaging, Customer, StockMovement, Supplier, Purchase, Return, SortableProductField, SortOrder, FinancialTransaction, ShipmentProduct, Account, Transfer, PaymentStatus, SalesProfitReportData } from './types';
// =================================================================
// API Client Functions
// =================================================================

const API_BASE_URL = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// --- User Functions ---
export async function login(username: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    return handleResponse<User>(response);
}

export async function getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    return handleResponse<User[]>(response);
}

export async function addUser(data: Omit<User, 'id'>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
}

export async function deleteUser(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
}


// --- Customer Functions ---
export async function getCustomers(): Promise<Customer[]> {
    const response = await fetch(`${API_BASE_URL}/customers`);
    return handleResponse<Customer[]>(response);
}

export async function addCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Customer>(response);
}

export async function updateCustomer(id: string, data: Omit<Customer, 'id'>): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Customer>(response);
}

export async function deleteCustomer(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
}

// --- Supplier Functions ---
export async function getSuppliers(): Promise<Supplier[]> {
    const response = await fetch(`${API_BASE_URL}/suppliers`);
    return handleResponse<Supplier[]>(response);
}

export async function addSupplier(data: Omit<Supplier, 'id'>): Promise<Supplier> {
    const response = await fetch(`${API_BASE_URL}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Supplier>(response);
}

export async function updateSupplier(id: string, data: Omit<Supplier, 'id'>): Promise<Supplier> {
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Supplier>(response);
}

export async function deleteSupplier(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
}


// --- Shipment Functions ---
export async function getShipments(): Promise<Shipment[]> {
    const response = await fetch(`${API_BASE_URL}/shipments`);
    return handleResponse<Shipment[]>(response);
}

export async function addShipment(data: Omit<Shipment, 'id' | 'createdAt' | 'status'>): Promise<Shipment> {
    const response = await fetch(`${API_BASE_URL}/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Shipment>(response);
}

export async function updateShipment(shipmentId: string, data: Partial<Shipment>): Promise<Shipment> {
    const response = await fetch(`${API_BASE_URL}/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Shipment>(response);
}

export async function deleteShipment(shipmentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/shipments/${shipmentId}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
}


// --- History/Checkout Functions ---
export async function processShipmentsToPackaging(shipmentIds: string[]): Promise<{message: string}> {
    const response = await fetch(`${API_BASE_URL}/shipments/process-to-packaging`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds }),
    });
    return handleResponse(response);
}


export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<{message: string}> {
     const response = await fetch(`${API_BASE_URL}/shipments/process-to-delivered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds }),
    });
    return handleResponse(response);
}

// --- Expedition Functions ---
export async function getExpeditions(): Promise<Expedition[]> {
    const response = await fetch(`${API_BASE_URL}/expeditions`);
    return handleResponse<Expedition[]>(response);
}

export async function addExpedition(name: string): Promise<Expedition> {
    const response = await fetch(`${API_BASE_URL}/expeditions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    return handleResponse<Expedition>(response);
}

export async function updateExpedition(id: string, name: string): Promise<Expedition> {
     const response = await fetch(`${API_BASE_URL}/expeditions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    return handleResponse<Expedition>(response);
}

export async function deleteExpedition(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/expeditions/${id}`, { method: 'DELETE' });
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
}

// --- Master Product Functions ---
export async function getProducts(sortBy: SortableProductField = 'code', sortOrder: SortOrder = 'asc'): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products?sortBy=${sortBy}&sortOrder=${sortOrder}`);
    return handleResponse<Product[]>(response);
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
    });
    return handleResponse<Product>(response);
}

export async function updateProduct(id: string, productUpdate: Partial<Omit<Product, 'id'>>): Promise<Product> {
     const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productUpdate),
    });
    return handleResponse<Product>(response);
}


export async function deleteMultipleProducts(ids: string[]): Promise<void> {
     const response = await fetch(`${API_BASE_URL}/products/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
}


export async function updateProductStock(id: string, newStock: number, notes: string): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStock, notes }),
    });
    return handleResponse<Product>(response);
}

export async function bulkUpdateProductStock(updates: { code: string; physicalStock: number; notes: string }[]): Promise<{ success: number; failure: number }> {
    const response = await fetch(`${API_BASE_URL}/products/bulk-stock-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
    });
    return handleResponse<{ success: number; failure: number }>(response);
}


export async function getStockMovements(productId: string): Promise<StockMovement[]> {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/stock-movements`);
    return handleResponse<StockMovement[]>(response);
}

// --- Packaging Functions ---
export async function getPackagingOptions(): Promise<Packaging[]> {
    const response = await fetch(`${API_BASE_URL}/packaging-options`);
    return handleResponse<Packaging[]>(response);
}

export async function addPackagingOption(data: Omit<Packaging, 'id'>): Promise<Packaging> {
     const response = await fetch(`${API_BASE_URL}/packaging-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Packaging>(response);
}

export async function updatePackagingOption(id: string, data: Omit<Packaging, 'id'>): Promise<Packaging> {
    const response = await fetch(`${API_BASE_URL}/packaging-options/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Packaging>(response);
}

export async function deletePackagingOption(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/packaging-options/${id}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
}

// --- Purchase Functions ---
export async function getPurchases(): Promise<Purchase[]> {
    const response = await fetch(`${API_BASE_URL}/purchases`);
    return handleResponse<Purchase[]>(response);
}

export async function addPurchase(data: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase> {
    const response = await fetch(`${API_BASE_URL}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Purchase>(response);
}

// --- Direct Sale Function ---
export async function processDirectSale(
    user: User, 
    customerId: string,
    products: ShipmentProduct[],
    accountId: string,
    paymentStatus: PaymentStatus,
): Promise<Shipment> {
     const response = await fetch(`${API_BASE_URL}/cashier/direct-sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, customerId, products, accountId, paymentStatus }),
    });
    return handleResponse<Shipment>(response);
}

// --- Return Functions ---
export async function getReturns(): Promise<Return[]> {
    const response = await fetch(`${API_BASE_URL}/returns`);
    return handleResponse<Return[]>(response);
}


export async function addReturn(data: { originalShipmentId: string, products: any[], reason: string }): Promise<Return> {
    const response = await fetch(`${API_BASE_URL}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Return>(response);
}

export async function getStockOpnameMovements(startDate?: Date, endDate?: Date): Promise<(StockMovement & { productCode: string, productName: string })[]> {
    if (!startDate || !endDate) return [];
    const response = await fetch(`${API_BASE_URL}/reports/stock-opname?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    return handleResponse<(StockMovement & { productCode: string, productName: string })[]>(response);
}

// --- Financial Account Functions ---
export async function getAccounts(): Promise<Account[]> {
    const response = await fetch(`${API_BASE_URL}/accounts`);
    return handleResponse<Account[]>(response);
}

export async function addAccount(data: Omit<Account, 'id' | 'createdAt' | 'balance'> & { balance?: number }): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Account>(response);
}

export async function updateAccount(id: string, data: Partial<Omit<Account, 'id' | 'createdAt' | 'balance'>>): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Account>(response);
}

export async function deleteAccount(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || 'Failed to delete account');
    }
}


// --- Financial Transaction Functions ---
export async function getFinancialTransactions(type?: 'in' | 'out', startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`${API_BASE_URL}/financials/transactions?${params.toString()}`);
    return handleResponse<FinancialTransaction[]>(response);
}


export async function addFinancialTransaction(data: Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>): Promise<FinancialTransaction> {
    const response = await fetch(`${API_BASE_URL}/financials/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<FinancialTransaction>(response);
}

export async function updateFinancialTransaction(id: string, data: Partial<Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>>): Promise<FinancialTransaction> {
    const response = await fetch(`${API_BASE_URL}/financials/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<FinancialTransaction>(response);
}

export async function deleteFinancialTransaction(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/financials/transactions/${id}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || 'Failed to delete transaction');
    }
}

export async function addInternalTransfer(data: Transfer): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/financials/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<{ message: string }>(response);
}


// --- Report Functions ---
export async function getSalesProfitReport(startDate: Date, endDate: Date, userId: string): Promise<SalesProfitReportData> {
    const params = new URLSearchParams();
    params.append('startDate', startDate.toISOString());
    params.append('endDate', endDate.toISOString());
    params.append('userId', userId);
    const response = await fetch(`${API_BASE_URL}/reports/sales-profit?${params.toString()}`);
    return handleResponse<SalesProfitReportData>(response);
}

// --- Payment Functions ---
export async function payReceivable(shipmentId: string, accountId: string, paidAt: Date): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/receivables/${shipmentId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, paidAt: paidAt.toISOString() }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || 'Failed to process receivable payment');
    }
}

export async function payPayable(purchaseId: string, accountId: string, paidAt: Date): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/payables/${purchaseId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, paidAt: paidAt.toISOString() }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || 'Failed to process payable payment');
    }
}

    