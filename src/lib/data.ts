
'use client';

import type { User, Shipment, Checkout, Expedition, Product, Packaging, Customer, StockMovement, Supplier, Purchase, Return, SortableProductField, SortOrder, FinancialTransaction, ShipmentProduct, Account, Transfer, PaymentStatus, SalesProfitReportData } from './types';

// This is a client-side in-memory store.
// In a real app, you'd use a proper state management library or server-side data fetching.
// let data = JSON.parse(JSON.stringify(initialData));

// const saveState = () => {
//     // In a browser environment, you could use localStorage. For now, it's in-memory.
// };

// const createNotification = (notification: { recipientId: string; message: string; url?: string }) => {
//     const { createNotification: create } = getNotificationContext();
//     create(notification);
// };


async function fetchWrapper(url: string, options?: RequestInit) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || 'Server responded with an error');
    }
    return response.json();
}

export async function login(username: string, password: string): Promise<User> {
    return fetchWrapper('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
}

export async function getUsers(): Promise<User[]> {
    return fetchWrapper('/api/users');
}

export async function addUser(userData: Omit<User, 'id'>): Promise<User> {
     return fetchWrapper('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
}

export async function updateUser(id: string, userUpdate: Partial<Omit<User, 'id'>>): Promise<User> {
     return fetchWrapper(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userUpdate),
    });
}

export async function deleteUser(id: string): Promise<void> {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
}

export async function getCustomers(): Promise<Customer[]> {
    return fetchWrapper('/api/customers');
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
     return fetchWrapper('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
    });
}

export async function updateCustomer(id: string, customerUpdate: Omit<Customer, 'id'>): Promise<Customer> {
    return fetchWrapper(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerUpdate),
    });
}

export async function deleteCustomer(id: string): Promise<void> {
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
}

export async function getSuppliers(): Promise<Supplier[]> {
    return fetchWrapper('/api/suppliers');
}

export async function addSupplier(supplierData: Omit<Supplier, 'id'>): Promise<Supplier> {
     return fetchWrapper('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData),
    });
}

export async function updateSupplier(id: string, supplierUpdate: Omit<Supplier, 'id'>): Promise<Supplier> {
    return fetchWrapper(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierUpdate),
    });
}

export async function deleteSupplier(id: string): Promise<void> {
    await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
}

export async function getShipments(): Promise<Shipment[]> {
    return fetchWrapper('/api/shipments');
}

export async function addShipment(shipmentData: Omit<Shipment, 'id' | 'createdAt' | 'status'>): Promise<Shipment> {
    return fetchWrapper('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentData),
    });
}


export async function updateShipment(shipmentId: string, shipmentUpdate: Partial<Shipment>): Promise<Shipment> {
    return fetchWrapper(`/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentUpdate),
    });
}


export async function deleteShipment(shipmentId: string): Promise<void> {
    await fetch(`/api/shipments/${shipmentId}`, { method: 'DELETE' });
}

export async function processShipmentsToPackaging(shipmentIds: string[]): Promise<void> {
    return fetchWrapper('/api/shipments/process-to-packaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds }),
    });
}


export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<void> {
    return fetchWrapper('/api/shipments/process-to-delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds }),
    });
}

export async function getExpeditions(): Promise<Expedition[]> {
    return fetchWrapper('/api/expeditions');
}

export async function addExpedition(name: string): Promise<Expedition> {
     return fetchWrapper('/api/expeditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
}

export async function updateExpedition(id: string, name: string): Promise<Expedition> {
    return fetchWrapper(`/api/expeditions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
}

export async function deleteExpedition(id: string): Promise<void> {
     await fetch(`/api/expeditions/${id}`, { method: 'DELETE' });
}

export async function getProducts(sortBy: SortableProductField = 'code', sortOrder: SortOrder = 'asc'): Promise<Product[]> {
    const url = new URL('/api/products', window.location.origin);
    url.searchParams.append('sortBy', sortBy);
    url.searchParams.append('sortOrder', sortOrder);
    return fetchWrapper(url.toString());
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
     return fetchWrapper('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
    });
}

export async function updateProduct(id: string, productUpdate: Partial<Omit<Product, 'id'>>): Promise<Product> {
     return fetchWrapper(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productUpdate),
    });
}

export async function deleteMultipleProducts(ids: string[]): Promise<void> {
    return fetchWrapper('/api/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
}

export async function updateProductStock(id: string, newStock: number, notes: string): Promise<Product> {
     return fetchWrapper(`/api/products/${id}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStock, notes }),
    });
}

export async function bulkUpdateProductStock(updates: { code: string; physicalStock: number; notes: string }[]): Promise<{ success: number; failure: number }> {
    return fetchWrapper('/api/products/bulk-stock-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
    });
}

export async function getStockMovements(productId: string): Promise<StockMovement[]> {
    return fetchWrapper(`/api/products/${productId}/stock-movements`);
}

export async function getPackagingOptions(): Promise<Packaging[]> {
    return fetchWrapper('/api/packaging-options');
}

export async function addPackagingOption(packagingData: Omit<Packaging, 'id'>): Promise<Packaging> {
    return fetchWrapper('/api/packaging-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packagingData),
    });
}

export async function updatePackagingOption(id: string, packagingUpdate: Omit<Packaging, 'id'>): Promise<Packaging> {
    return fetchWrapper(`/api/packaging-options/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packagingUpdate),
    });
}

export async function deletePackagingOption(id: string): Promise<void> {
     await fetch(`/api/packaging-options/${id}`, { method: 'DELETE' });
}

export async function getPurchases(): Promise<Purchase[]> {
    return fetchWrapper('/api/purchases');
}

export async function addPurchase(purchaseData: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase> {
    return fetchWrapper('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData),
    });
}

export async function processDirectSale(user: User, customerId: string, products: ShipmentProduct[], accountId: string, paymentStatus: PaymentStatus): Promise<Shipment> {
    return fetchWrapper('/api/cashier/direct-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, customerId, products, accountId, paymentStatus }),
    });
}

export async function getReturns(): Promise<Return[]> {
    return fetchWrapper('/api/returns');
}

export async function addReturn(returnData: Omit<Return, 'id' | 'createdAt' | 'originalTransactionId' | 'customerName'> & { originalShipmentId: string }): Promise<Return> {
    return fetchWrapper('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
    });
}

export async function getStockOpnameMovements(startDate?: Date, endDate?: Date): Promise<(StockMovement & { productCode: string, productName: string })[]> {
    const url = new URL('/api/reports/stock-opname', window.location.origin);
    if (startDate) url.searchParams.append('startDate', startDate.toISOString());
    if (endDate) url.searchParams.append('endDate', endDate.toISOString());
    return fetchWrapper(url.toString());
}

export async function getAccounts(): Promise<Account[]> {
    return fetchWrapper('/api/accounts');
}

export async function addAccount(accountData: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
     return fetchWrapper('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
    });
}

export async function updateAccount(id: string, accountUpdate: Partial<Omit<Account, 'id' | 'createdAt' | 'balance'>>): Promise<Account> {
     return fetchWrapper(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountUpdate),
    });
}

export async function deleteAccount(id: string): Promise<void> {
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
}

export async function getFinancialTransactions(type?: 'in' | 'out', startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    const url = new URL('/api/financials/transactions', window.location.origin);
    if(type) url.searchParams.append('type', type);
    if(startDate) url.searchParams.append('startDate', startDate);
    if(endDate) url.searchParams.append('endDate', endDate);
    return fetchWrapper(url.toString());
}

export async function addFinancialTransaction(txData: Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>): Promise<FinancialTransaction> {
    return fetchWrapper('/api/financials/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData),
    });
}

export async function updateFinancialTransaction(id: string, txUpdate: Partial<Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>>): Promise<FinancialTransaction> {
    return fetchWrapper(`/api/financials/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txUpdate),
    });
}

export async function deleteFinancialTransaction(id: string): Promise<void> {
    await fetch(`/api/financials/transactions/${id}`, { method: 'DELETE' });
}

export async function addInternalTransfer(transferData: Transfer): Promise<{ message: string }> {
     return fetchWrapper('/api/financials/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
    });
}

export async function getSalesProfitReport(startDate: Date, endDate: Date, userId: string = 'all'): Promise<SalesProfitReportData> {
    const url = new URL('/api/reports/sales-profit', window.location.origin);
    url.searchParams.append('startDate', startDate.toISOString());
    url.searchParams.append('endDate', endDate.toISOString());
    url.searchParams.append('userId', userId);
    return fetchWrapper(url.toString());
}

export async function payReceivable(shipmentId: string, accountId: string, paidAt: Date): Promise<void> {
    return fetchWrapper(`/api/receivables/${shipmentId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, paidAt: paidAt.toISOString() }),
    });
}

export async function payPayable(purchaseId: string, accountId: string, paidAt: Date): Promise<void> {
     return fetchWrapper(`/api/payables/${purchaseId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, paidAt: paidAt.toISOString() }),
    });
}


    