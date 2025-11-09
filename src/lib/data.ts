
'use client';

import type { User, Shipment, Checkout, Expedition, Product, Packaging, Customer, StockMovement, Supplier, Purchase, Return, SortableProductField, SortOrder, FinancialTransaction, ShipmentProduct, Account, Transfer, PaymentStatus, SalesProfitReportData } from './types';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export async function login(username: string, password: string): Promise<User> {
    const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
}

export async function getUsers(): Promise<User[]> {
    const response = await fetch('/api/users');
    return handleResponse(response);
}

export async function addUser(userData: Omit<User, 'id'>): Promise<User> {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    return handleResponse(response);
}

export async function updateUser(id: string, userUpdate: Partial<Omit<User, 'id'>>): Promise<User> {
    const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userUpdate),
    });
    return handleResponse(response);
}

export async function deleteUser(id: string): Promise<void> {
    const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    await handleResponse(response);
}

export async function getCustomers(): Promise<Customer[]> {
    const response = await fetch('/api/customers');
    return handleResponse(response);
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
    const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
    });
    return handleResponse(response);
}

export async function updateCustomer(id: string, customerUpdate: Omit<Customer, 'id'>): Promise<Customer> {
    const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerUpdate),
    });
    return handleResponse(response);
}

export async function deleteCustomer(id: string): Promise<void> {
    const response = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    await handleResponse(response);
}

export async function getSuppliers(): Promise<Supplier[]> {
    const response = await fetch('/api/suppliers');
    return handleResponse(response);
}

export async function addSupplier(supplierData: Omit<Supplier, 'id'>): Promise<Supplier> {
    const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData),
    });
    return handleResponse(response);
}

export async function updateSupplier(id: string, supplierUpdate: Omit<Supplier, 'id'>): Promise<Supplier> {
    const response = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierUpdate),
    });
    return handleResponse(response);
}

export async function deleteSupplier(id: string): Promise<void> {
    const response = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    await handleResponse(response);
}

export async function getShipments(): Promise<Shipment[]> {
    const response = await fetch('/api/shipments');
    return handleResponse(response);
}

export async function addShipment(shipmentData: any): Promise<Shipment> {
    const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentData),
    });
    return handleResponse(response);
}

export async function updateShipment(shipmentId: string, shipmentUpdate: any): Promise<Shipment> {
    const response = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentUpdate),
    });
    return handleResponse(response);
}

export async function deleteShipment(shipmentId: string): Promise<void> {
    const response = await fetch(`/api/shipments/${shipmentId}`, { method: 'DELETE' });
    await handleResponse(response);
}

export async function processShipmentsToPackaging(shipmentIds: string[]): Promise<void> {
    const response = await fetch('/api/shipments/process-to-packaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds }),
    });
    await handleResponse(response);
}

export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<void> {
    const response = await fetch('/api/shipments/process-to-delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds }),
    });
    await handleResponse(response);
}

export async function getExpeditions(): Promise<Expedition[]> {
    const response = await fetch('/api/expeditions');
    return handleResponse(response);
}

export async function addExpedition(name: string): Promise<Expedition> {
    const response = await fetch('/api/expeditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    return handleResponse(response);
}

export async function updateExpedition(id: string, name: string): Promise<Expedition> {
    const response = await fetch(`/api/expeditions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    return handleResponse(response);
}

export async function deleteExpedition(id: string): Promise<void> {
    const response = await fetch(`/api/expeditions/${id}`, { method: 'DELETE' });
    await handleResponse(response);
}

export async function getProducts(sortBy: SortableProductField = 'code', sortOrder: SortOrder = 'asc'): Promise<Product[]> {
    const response = await fetch(`/api/products?sortBy=${sortBy}&sortOrder=${sortOrder}`);
    return handleResponse(response);
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
    });
    return handleResponse(response);
}

export async function updateProduct(id: string, productUpdate: Partial<Omit<Product, 'id'>>): Promise<Product> {
    const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productUpdate),
    });
    return handleResponse(response);
}

export async function deleteMultipleProducts(ids: string[]): Promise<void> {
    const response = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    await handleResponse(response);
}

export async function updateProductStock(id: string, newStock: number, notes: string): Promise<Product> {
    const response = await fetch(`/api/products/${id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStock, notes }),
    });
    return handleResponse(response);
}

export async function bulkUpdateProductStock(updates: { code: string; physicalStock: number; notes: string }[]): Promise<{ success: number; failure: number }> {
    const response = await fetch(`/api/products/bulk-stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
    });
    return handleResponse(response);
}

export async function getStockMovements(productId: string): Promise<StockMovement[]> {
    const response = await fetch(`/api/products/${productId}/stock-movements`);
    return handleResponse(response);
}

export async function getPackagingOptions(): Promise<Packaging[]> {
    const response = await fetch('/api/packaging');
    return handleResponse(response);
}

export async function addPackagingOption(packagingData: Omit<Packaging, 'id'>): Promise<Packaging> {
    const response = await fetch('/api/packaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packagingData),
    });
    return handleResponse(response);
}

export async function updatePackagingOption(id: string, packagingUpdate: Omit<Packaging, 'id'>): Promise<Packaging> {
    const response = await fetch(`/api/packaging/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packagingUpdate),
    });
    return handleResponse(response);
}

export async function deletePackagingOption(id: string): Promise<void> {
    const response = await fetch(`/api/packaging/${id}`, { method: 'DELETE' });
    await handleResponse(response);
}

export async function getPurchases(): Promise<Purchase[]> {
    const response = await fetch('/api/purchases');
    return handleResponse(response);
}

export async function addPurchase(purchaseData: any): Promise<Purchase> {
    const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData),
    });
    return handleResponse(response);
}

export async function processDirectSale(user: User, customerId: string, products: ShipmentProduct[], accountId: string, paymentStatus: PaymentStatus): Promise<Shipment> {
    const response = await fetch('/api/sales/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, customerId, products, accountId, paymentStatus }),
    });
    return handleResponse(response);
}

export async function getReturns(): Promise<Return[]> {
    const response = await fetch('/api/returns');
    return handleResponse(response);
}

export async function addReturn(returnData: any): Promise<Return> {
    const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
    });
    return handleResponse(response);
}

export async function getStockOpnameMovements(startDate?: Date, endDate?: Date): Promise<(StockMovement & { productCode: string, productName: string })[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    const response = await fetch(`/api/stock-movements/opname?${params.toString()}`);
    return handleResponse(response);
}

export async function getAccounts(): Promise<Account[]> {
    const response = await fetch('/api/accounts');
    return handleResponse(response);
}

export async function addAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'balance'> & { balance?: number }): Promise<Account> {
    const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
    });
    return handleResponse(response);
}

export async function updateAccount(id: string, accountUpdate: Partial<Omit<Account, 'id' | 'createdAt' | 'balance'>>): Promise<Account> {
    const response = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountUpdate),
    });
    return handleResponse(response);
}

export async function deleteAccount(id: string): Promise<void> {
    const response = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    await handleResponse(response);
}

export async function getFinancialTransactions(type?: 'in' | 'out', startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await fetch(`/api/financial-transactions?${params.toString()}`);
    return handleResponse(response);
}

export async function addFinancialTransaction(txData: Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>): Promise<FinancialTransaction> {
    const response = await fetch('/api/financial-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData),
    });
    return handleResponse(response);
}

export async function updateFinancialTransaction(id: string, txUpdate: Partial<Omit<FinancialTransaction, 'id' | 'createdAt' | 'account'>>): Promise<FinancialTransaction> {
    const response = await fetch(`/api/financial-transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txUpdate),
    });
    return handleResponse(response);
}

export async function deleteFinancialTransaction(id: string): Promise<void> {
    const response = await fetch(`/api/financial-transactions/${id}`, { method: 'DELETE' });
    await handleResponse(response);
}

export async function addInternalTransfer(transferData: Transfer): Promise<{ message: string }> {
    const response = await fetch('/api/financial-transactions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
    });
    return handleResponse(response);
}

export async function getSalesProfitReport(startDate: Date, endDate: Date, userId: string = 'all'): Promise<SalesProfitReportData> {
    const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        userId,
    });
    const response = await fetch(`/api/reports/sales-profit?${params.toString()}`);
    return handleResponse(response);
}

export async function payReceivable(shipmentId: string, accountId: string, paidAt: Date): Promise<void> {
    const response = await fetch(`/api/receivables/${shipmentId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, paidAt: paidAt.toISOString() }),
    });
    await handleResponse(response);
}

export async function payPayable(purchaseId: string, accountId: string, paidAt: Date): Promise<void> {
    const response = await fetch(`/api/payables/${purchaseId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, paidAt: paidAt.toISOString() }),
    });
    await handleResponse(response);
}
