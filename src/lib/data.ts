'use client';

import type { User, Shipment, Checkout } from '@/lib/types';

// =================================================================
// Helper functions to interact with localStorage
// =================================================================

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const item = JSON.stringify(value);
    window.localStorage.setItem(key, item);
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
};


// =================================================================
// Initial Mock Data (used only if localStorage is empty)
// =================================================================
const initialShipments: Shipment[] = [];

const initialUsers: User[] = [
    { id: 'usr_1', username: 'admin', name: 'Admin', role: 'admin' },
    { id: 'usr_2', username: 'user', name: 'User Biasa', role: 'user' },
];

// =================================================================
// Data Access Functions (Now using localStorage)
// =================================================================

// User Functions
export function getDummyUsers(): User[] {
    return initialUsers;
}

export async function login(username: string, password: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    const user = initialUsers.find(u => u.username === username);
    // In a real app, you'd hash and compare passwords. Here we use plain text for demo.
    if (user && user.username === password) { 
        return user;
    }
    throw new Error('Username atau password salah.');
}

// Shipment Functions
export async function getShipments(): Promise<Shipment[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const shipments = getFromStorage('shipments', null);
  if (shipments === null) {
      saveToStorage('shipments', initialShipments);
      return [...initialShipments];
  }
  return [...shipments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addShipment(data: Omit<Shipment, 'id' | 'createdAt' | 'totalItems' | 'totalAmount'>): Promise<Shipment> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const shipments = await getShipments();

  if (shipments.some(s => s.transactionId.toLowerCase() === data.transactionId.toLowerCase())) {
    throw new Error('ID Transaksi harus unik.');
  }

  const totalItems = data.products.reduce((sum, p) => sum + p.quantity, 0);
  const totalAmount = data.products.reduce((sum, p) => {
    const discountedPrice = p.price * (1 - p.discount / 100);
    return sum + (discountedPrice * p.quantity);
  }, 0);

  const newShipment: Shipment = {
    ...data,
    id: `ship_${Date.now()}`,
    createdAt: new Date().toISOString(),
    totalItems,
    totalAmount,
    products: data.products.map(p => ({ ...p }))
  };
  
  const updatedShipments = [newShipment, ...shipments];
  saveToStorage('shipments', updatedShipments);

  return newShipment;
}

export async function deleteShipment(shipmentId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    let shipments = await getShipments();
    const updatedShipments = shipments.filter(s => s.id !== shipmentId);
    
    if (shipments.length === updatedShipments.length) {
        throw new Error('Pengiriman tidak ditemukan.');
    }
    
    saveToStorage('shipments', updatedShipments);
}

// History/Checkout Functions
export async function processShipments(shipmentIds: string[]): Promise<Checkout[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    let shipments = await getShipments();
    let checkoutHistory = await getCheckoutHistory();
    
    const shipmentsToProcess = shipments.filter(s => shipmentIds.includes(s.id));
    const newHistoryItems: Checkout[] = [];

    for (const shipment of shipmentsToProcess) {
        const newCheckout: Checkout = {
            id: `checkout_${Date.now()}_${shipment.id}`,
            transactionId: shipment.transactionId,
            customerName: shipment.user, 
            items: shipment.products.map(p => ({
                name: p.name,
                quantity: p.quantity,
                price: p.price,
                discount: p.discount,
                subtotal: p.price * p.quantity * (1 - p.discount / 100)
            })),
            totalItems: shipment.totalItems,
            totalAmount: shipment.totalAmount,
            createdAt: new Date().toISOString(),
        };
        newHistoryItems.push(newCheckout);
    }
    
    if (newHistoryItems.length > 0) {
        const updatedHistory = [...newHistoryItems, ...checkoutHistory];
        saveToStorage('checkoutHistory', updatedHistory);
    }
    
    return newHistoryItems;
}


export async function getCheckoutHistory(): Promise<Checkout[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const history = getFromStorage<Checkout[]>('checkoutHistory', []);
     if (getFromStorage('checkoutHistory', null) === null) {
      saveToStorage('checkoutHistory', []);
    }
    return [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
