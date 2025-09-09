
'use client';

import type { User, Shipment, Checkout, Expedition, Product, Packaging, Customer, StockMovement, Supplier, Purchase, Return, SortableProductField, SortOrder, FinancialTransaction, ShipmentProduct, Account } from './types';
import type { SalesProfitReportData } from '@/app/api/reports/sales-profit/route';
// =================================================================
// API Client Functions
// =================================================================

const API_BASE_URL = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
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
    await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
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
    await fetch(`${API_BASE_URL}/customers/${id}`, { method: 'DELETE' });
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
    await fetch(`${API_BASE_URL}/suppliers/${id}`, { method: 'DELETE' });
}


// --- Shipment Functions ---
export async function getShipments(): Promise<Shipment[]> {
    const response = await fetch(`${API_BASE_URL}/shipments`);
    return handleResponse<Shipment[]>(response);
}

export async function addShipment(data: Omit<Shipment, 'id' | 'createdAt' | 'status' | 'totalItems' | 'totalAmount' | 'totalProductCost' | 'totalPackingCost' | 'customerName'> & { packagingCost: number }): Promise<Shipment> {
    const response = await fetch(`${API_BASE_URL}/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Shipment>(response);
}

export async function updateShipment(shipmentId: string, data: Omit<Shipment, 'id' | 'createdAt' | 'status' | 'totalItems' | 'totalAmount' | 'totalProductCost' | 'totalPackingCost' | 'customerName'> & { packagingCost: number }): Promise<Shipment> {
    const response = await fetch(`${API_BASE_URL}/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Shipment>(response);
}

export async function deleteShipment(shipmentId: string): Promise<void> {
    await fetch(`${API_BASE_URL}/shipments/${shipmentId}`, { method: 'DELETE' });
}


// --- History/Checkout Functions ---
export async function processShipmentsToPackaging(shipmentIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/shipments/process-to-packaging`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds }),
    });
    // Check if response is ok, otherwise throw error from body
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process shipments');
    }
}


export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<void> {
     const response = await fetch(`${API_BASE_URL}/shipments/process-to-delivered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds }),
    });
     if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark as delivered');
    }
}


export async function getCheckoutHistory(): Promise<Checkout[]> {
    // This function needs a new API endpoint if required. For now, it will be empty.
    return Promise.resolve([]);
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
    await fetch(`${API_BASE_URL}/expeditions/${id}`, { method: 'DELETE' });
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

export async function updateProduct(id: string, productUpdate: Omit<Product, 'id'>): Promise<Product> {
     const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productUpdate),
    });
    return handleResponse<Product>(response);
}

export async function deleteProduct(id: string): Promise<void> {
     await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
}

export async function deleteMultipleProducts(ids: string[]): Promise<void> {
     await fetch(`${API_BASE_URL}/products`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
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
    const response = await fetch(`${API_BASE_URL}/products/bulk-stock`, {
        method: 'PUT',
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
    const response = await fetch(`${API_BASE_URL}/packaging`);
    return handleResponse<Packaging[]>(response);
}

export async function addPackagingOption(data: Omit<Packaging, 'id'>): Promise<Packaging> {
     const response = await fetch(`${API_BASE_URL}/packaging`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Packaging>(response);
}

export async function updatePackagingOption(id: string, data: Omit<Packaging, 'id'>): Promise<Packaging> {
    const response = await fetch(`${API_BASE_URL}/packaging/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<Packaging>(response);
}

export async function deletePackagingOption(id: string): Promise<void> {
    await fetch(`${API_BASE_URL}/packaging/${id}`, { method: 'DELETE' });
}

// --- Purchase Functions ---
export async function getPurchases(): Promise<Purchase[]> {
    const response = await fetch(`${API_BASE_URL}/purchases`);
    return handleResponse<Purchase[]>(response);
}

export async function addPurchase(data: Omit<Purchase, 'id' | 'createdAt' | 'status' | 'totalAmount'>): Promise<Purchase> {
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
    accountId: string
): Promise<Shipment> {
     const response = await fetch(`${API_BASE_URL}/sales/direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, customerId, products, accountId }),
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
    const response = await fetch(`${API_BASE_URL}/stock-movements/opname?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    return handleResponse<(StockMovement & { productCode: string, productName: string })[]>(response);
}

// --- Financial Account Functions ---
export async function getAccounts(): Promise<Account[]> {
    const response = await fetch(`${API_BASE_URL}/accounts`);
    return handleResponse<Account[]>(response);
}

export async function addAccount(data: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
    }
}


// --- Financial Transaction Functions ---
export async function getFinancialTransactions(type?: 'in' | 'out', startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`${API_BASE_URL}/financial-transactions?${params.toString()}`);
    return handleResponse<FinancialTransaction[]>(response);
}


export async function addFinancialTransaction(data: Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>): Promise<FinancialTransaction> {
    const response = await fetch(`${API_BASE_URL}/financial-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<FinancialTransaction>(response);
}

export async function updateFinancialTransaction(id: string, data: Partial<Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>>): Promise<FinancialTransaction> {
    const response = await fetch(`${API_BASE_URL}/financial-transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<FinancialTransaction>(response);
}

export async function deleteFinancialTransaction(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/financial-transactions/${id}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete transaction');
    }
}

// --- Report Functions ---
export async function getSalesProfitReport(startDate: Date, endDate: Date): Promise<SalesProfitReportData> {
    const response = await fetch(`${API_BASE_URL}/reports/sales-profit?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    return handleResponse<SalesProfitReportData>(response);
}
