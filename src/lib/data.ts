
'use client';

import type { User, Shipment, Checkout, Expedition, Product, Packaging } from '@/lib/types';


const API_BASE_URL = '/api';

// =================================================================
// Helper functions to interact with the API
// =================================================================
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    // For DELETE requests, there might not be a body
    if (response.status === 204) {
        return null as T;
    }
    return response.json();
  } catch (error) {
      console.error(`API call failed for endpoint ${endpoint}:`, error);
      throw error;
  }
}


// =================================================================
// Data Access Functions (Now using API Routes)
// =================================================================

// User Functions
export function getDummyUsers(): User[] {
    // This can remain client-side for the login simulation
    return [
        { id: 'usr_1', username: 'admin', name: 'Admin', role: 'admin' },
        { id: 'usr_2', username: 'user', name: 'User Biasa', role: 'user' },
    ];
}

export async function login(username: string, password: string): Promise<User> {
    // Login logic remains client-side for this demo since there's no real auth
    await new Promise(resolve => setTimeout(resolve, 500));
    const user = getDummyUsers().find(u => u.username === username);
    if (user && user.username === password) { 
        return user;
    }
    throw new Error('Username atau password salah.');
}

// Shipment Functions
export async function getShipments(): Promise<Shipment[]> {
  return fetchApi<Shipment[]>('/shipments');
}

export async function addShipment(data: Omit<Shipment, 'id' | 'createdAt' | 'totalItems' | 'totalAmount' | 'totalProductCost' | 'status'>): Promise<Shipment> {
  return fetchApi<Shipment>('/shipments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateShipment(shipmentId: string, data: Omit<Shipment, 'id' | 'createdAt' | 'status' | 'totalItems' | 'totalAmount' | 'totalProductCost' >): Promise<Shipment> {
    return fetchApi<Shipment>(`/shipments/${shipmentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteShipment(shipmentId: string): Promise<void> {
    await fetchApi(`/shipments/${shipmentId}`, {
        method: 'DELETE',
    });
}

// History/Checkout Functions
export async function processShipmentsToPackaging(shipmentIds: string[]): Promise<void> {
    await fetchApi('/shipments/process-to-packaging', {
        method: 'POST',
        body: JSON.stringify({ shipmentIds }),
    });
}

export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<void> {
    await fetchApi('/shipments/process-to-delivered', {
        method: 'POST',
        body: JSON.stringify({ shipmentIds }),
    });
}

export async function getCheckoutHistory(): Promise<Checkout[]> {
    return fetchApi<Checkout[]>('/checkoutHistory');
}

// Expedition Functions
export async function getExpeditions(): Promise<Expedition[]> {
    return fetchApi<Expedition[]>('/expeditions');
}

export async function addExpedition(name: string): Promise<Expedition> {
    return fetchApi<Expedition>('/expeditions', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
}

export async function updateExpedition(id: string, name: string): Promise<Expedition> {
    return fetchApi<Expedition>(`/expeditions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
    });
}

export async function deleteExpedition(id: string): Promise<void> {
    await fetchApi(`/expeditions/${id}`, {
        method: 'DELETE',
    });
}

// Master Product Functions
export async function getProducts(): Promise<Product[]> {
    return fetchApi<Product[]>('/products');
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    return fetchApi<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(product),
    });
}

export async function updateProduct(id: string, productUpdate: Omit<Product, 'id'>): Promise<Product> {
    return fetchApi<Product>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productUpdate),
    });
}

export async function deleteProduct(id: string): Promise<void> {
    await fetchApi(`/products/${id}`, {
        method: 'DELETE',
    });
}

export async function updateProductStock(id: string, newStock: number): Promise<Product> {
    return fetchApi<Product>(`/products/stock/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ stock: newStock }),
    });
}

// Packaging Functions
export async function getPackagingOptions(): Promise<Packaging[]> {
    return fetchApi<Packaging[]>('/packaging');
}

export async function addPackagingOption(data: Omit<Packaging, 'id'>): Promise<Packaging> {
    return fetchApi<Packaging>('/packaging', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updatePackagingOption(id: string, data: Omit<Packaging, 'id'>): Promise<Packaging> {
    return fetchApi<Packaging>(`/packaging/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deletePackagingOption(id: string): Promise<void> {
    await fetchApi(`/packaging/${id}`, {
        method: 'DELETE',
    });
}
