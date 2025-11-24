

import type { Expedition, Packaging, Shipment, User, Product, Customer, Supplier, Purchase, FinancialTransaction, Account, SalesProfitReportData, StockMovement, Return } from './types';
import { produce } from 'immer';

const API_BASE_URL = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// User Functions
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

// Shipment Functions
export async function getShipments(): Promise<Shipment[]> {
    const response = await fetch(`${API_BASE_URL}/shipments`);
    return handleResponse<Shipment[]>(response);
}

export async function addShipment(shipment: Omit<Shipment, 'id' | 'createdAt' | 'status'> & { user: User | null }): Promise<Shipment> {
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

export async function processShipmentsToPackaging(shipmentIds: string[], user: User | null): Promise<Shipment[]> {
    const response = await fetch(`${API_BASE_URL}/shipments/process-to-packaging`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds, user }),
    });
    return handleResponse<Shipment[]>(response);
}


export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<Shipment[]> {
    const response = await fetch(`${API_BASE_URL}/shipments/process-to-delivered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds }),
    });
    return handleResponse<Shipment[]>(response);
}


// Expedition Functions
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

export async function deleteExpedition(id: string): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/expeditions/${id}`, { method: 'DELETE' });
    return handleResponse<{ id: string }>(response);
}

// Packaging Options
export async function getPackagingOptions(): Promise<Packaging[]> {
    const response = await fetch(`${API_BASE_URL}/packaging`);
    return handleResponse<Packaging[]>(response);
}

export async function addPackagingOption(option: Omit<Packaging, 'id'>): Promise<Packaging> {
    const response = await fetch(`${API_BASE_URL}/packaging`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(option),
    });
    return handleResponse<Packaging>(response);
}

export async function updatePackagingOption(id: string, option: Omit<Packaging, 'id'>): Promise<Packaging> {
    const response = await fetch(`${API_BASE_URL}/packaging/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(option),
    });
    return handleResponse<Packaging>(response);
}

export async function deletePackagingOption(id: string): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/packaging/${id}`, { method: 'DELETE' });
    return handleResponse<{ id: string }>(response);
}

// Product Functions
export async function getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products`);
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

export async function updateProduct(id: string, product: Partial<Omit<Product, 'id'>>): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
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

export async function updateProductStock(id: string, physicalStock: number, notes: string): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ physicalStock, notes }),
    });
    return handleResponse<Product>(response);
}

export async function bulkUpdateProductStock(updates: { code: string; physicalStock: number; notes: string }[]) {
     const response = await fetch(`${API_BASE_URL}/products/bulk-stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
    });
    return handleResponse<{ success: number; failure: number; }>(response);
}


// Customer Functions
export async function getCustomers(): Promise<Customer[]> {
    const response = await fetch(`${API_BASE_URL}/customers`);
    return handleResponse<Customer[]>(response);
}

export async function addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
    });
    return handleResponse<Customer>(response);
}

export async function updateCustomer(id: string, customer: Partial<Omit<Customer, 'id'>>): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
    });
    return handleResponse<Customer>(response);
}

export async function deleteCustomer(id: string): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, { method: 'DELETE' });
    return handleResponse<{ id: string }>(response);
}

// Supplier Functions
export async function getSuppliers(): Promise<Supplier[]> {
    const response = await fetch(`${API_BASE_URL}/suppliers`);
    return handleResponse<Supplier[]>(response);
}

export async function addSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const response = await fetch(`${API_BASE_URL}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier),
    });
    return handleResponse<Supplier>(response);
}

export async function updateSupplier(id: string, supplier: Partial<Omit<Supplier, 'id'>>): Promise<Supplier> {
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier),
    });
    return handleResponse<Supplier>(response);
}

export async function deleteSupplier(id: string): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, { method: 'DELETE' });
    return handleResponse<{ id: string }>(response);
}

// Purchase Functions
export async function getPurchases(): Promise<Purchase[]> {
    const response = await fetch(`${API_BASE_URL}/purchases`);
    return handleResponse<Purchase[]>(response);
}

export async function addPurchase(purchase: Omit<Purchase, 'id' | 'createdAt' | 'totalAmount'>): Promise<Purchase> {
    const response = await fetch(`${API_BASE_URL}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchase),
    });
    return handleResponse<Purchase>(response);
}

// Financial Transaction Functions
export async function getFinancialTransactions(accountId?: string, startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    const params = new URLSearchParams();
    if (accountId) params.append('accountId', accountId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
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

export async function addInternalTransfer(transferData: { fromAccountId: string, toAccountId: string, amount: number, transferDate: Date, description: string }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/financial-transactions/internal-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
    });
    return handleResponse<void>(response);
}


// Account Functions
export async function getAccounts(): Promise<Account[]> {
    const response = await fetch(`${API_BASE_URL}/accounts`);
    return handleResponse<Account[]>(response);
}

export async function addAccount(account: Omit<Account, 'id' | 'createdAt' | 'balance'> & { balance?: number }): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
    });
    return handleResponse<Account>(response);
}

export async function updateAccount(id: string, account: Partial<Omit<Account, 'id' | 'createdAt' | 'balance'>>): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
    });
    return handleResponse<Account>(response);
}

export async function deleteAccount(id: string): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, { method: 'DELETE' });
    return handleResponse<{ id: string }>(response);
}

// Cashier/Direct Sale
export async function processDirectSale(user: User, customerId: string, cart: any[], accountId: string, paymentStatus: 'Lunas' | 'Belum Lunas'): Promise<Shipment> {
    const response = await fetch(`${API_BASE_URL}/cashier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, customerId, cart, accountId, paymentStatus }),
    });
    return handleResponse<Shipment>(response);
}

// Payables & Receivables
export async function payPayable(purchaseId: string, accountId: string, paidAt: Date): Promise<void> {
     const response = await fetch(`${API_BASE_URL}/payables/${purchaseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, paidAt }),
    });
    return handleResponse<void>(response);
}

export async function payReceivable(shipmentId: string, accountId: string, paidAt: Date): Promise<void> {
     const response = await fetch(`${API_BASE_URL}/receivables/${shipmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, paidAt }),
    });
    return handleResponse<void>(response);
}

// Reports
export async function getSalesProfitReport(startDate: Date, endDate: Date, userId: string): Promise<SalesProfitReportData> {
    const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        userId,
    });
    const response = await fetch(`${API_BASE_URL}/reports/sales-profit?${params.toString()}`);
    return handleResponse<SalesProfitReportData>(response);
}

// Stock Movements
export async function getStockMovements(productId: string): Promise<StockMovement[]> {
    const response = await fetch(`${API_BASE_URL}/stock-movements/${productId}`);
    return handleResponse<StockMovement[]>(response);
}

// Returns
export async function getReturns(): Promise<Return[]> {
    const response = await fetch(`${API_BASE_URL}/returns`);
    return handleResponse<Return[]>(response);
}

export async function addReturn(returnData: Omit<Return, 'id'|'createdAt'|'originalTransactionId'|'customerName'|'totalAmount'>): Promise<Return> {
     const response = await fetch(`${API_BASE_URL}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
    });
    return handleResponse<Return>(response);
}

export async function getStockOpnameMovements(startDate?: Date, endDate?: Date): Promise<(StockMovement & { productCode: string, productName: string })[]> {
    if (!startDate || !endDate) return [];
    const response = await fetch(`${API_BASE_URL}/reports/stock-opname?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    return handleResponse<(StockMovement & { productCode: string, productName: string })[]>(response);
}
