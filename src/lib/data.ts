'use client';

import type { User, Shipment, Checkout, ProcessedShipmentSummary, Expedition } from '@/lib/types';

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
  } catch (error)
    {
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

const initialExpeditions: Expedition[] = [
    { id: 'exp_1', name: 'JNE' },
    { id: 'exp_2', name: 'POS' },
    { id: 'exp_3', name: 'J&T' },
    { id: 'exp_4', name: 'ANTERAJA' },
    { id: 'exp_5', name: 'SICEPAT' },
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
      saveToStorage('shipments', []); // Start with empty array
      return [];
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
  
  const totalShoppingAmount = data.products.reduce((sum, p) => {
    const subtotal = (p.price * p.quantity) - p.discount;
    return sum + subtotal;
  }, 0);
  
  const totalPackingAmount = data.products.reduce((sum, p) => sum + p.packingFee, 0);

  const grandTotal = totalShoppingAmount + totalPackingAmount;

  const newShipment: Shipment = {
    ...data,
    id: `ship_${Date.now()}_${Math.random()}`,
    createdAt: new Date().toISOString(),
    totalItems,
    totalAmount: grandTotal,
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
export async function processShipments(shipmentIds: string[]): Promise<Checkout> {
    await new Promise(resolve => setTimeout(resolve, 200));

    let shipments = await getShipments();
    let checkoutHistory = await getCheckoutHistory();
    const storedUser = getFromStorage<User | null>('user', null);
    
    const shipmentsToProcess = shipments.filter(s => shipmentIds.includes(s.id));
    if (shipmentsToProcess.length === 0) {
        throw new Error("Tidak ada pengiriman yang valid untuk diproses.");
    }

    const processedShipments: ProcessedShipmentSummary[] = shipmentsToProcess.map(s => ({
        shipmentId: s.id, // Keep the original ID
        transactionId: s.transactionId,
        totalAmount: s.totalAmount,
        totalItems: s.totalItems,
    }));

    const totalBatchAmount = processedShipments.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalBatchItems = processedShipments.reduce((sum, s) => sum + s.totalItems, 0);

    const newBatchCheckout: Checkout = {
        id: `batch_${Date.now()}`,
        processorName: storedUser?.name || 'Unknown User',
        processedShipments: processedShipments,
        totalBatchAmount: totalBatchAmount,
        totalBatchItems: totalBatchItems,
        createdAt: new Date().toISOString(),
    };
    
    const updatedHistory = [newBatchCheckout, ...checkoutHistory];
    saveToStorage('checkoutHistory', updatedHistory);
    
    // Data in 'shipments' is NOT removed, as per user request.
    
    return newBatchCheckout;
}


export async function getCheckoutHistory(): Promise<Checkout[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const history = getFromStorage<Checkout[]>('checkoutHistory', []);
     if (getFromStorage('checkoutHistory', null) === null) {
      saveToStorage('checkoutHistory', []);
    }
    return [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}


/**
 * Gets all shipments that have been processed and are part of the checkout history.
 * @returns A promise that resolves to an array of unique Shipments ready for invoicing.
 */
export async function getProcessedShipmentsForInvoicing(): Promise<Shipment[]> {
    await new Promise(resolve => setTimeout(resolve, 100));

    const allShipments = await getShipments();
    const history = await getCheckoutHistory();

    // 1. Get all unique shipment IDs from the entire history
    const processedShipmentIds = new Set<string>();
    history.forEach(batch => {
        if (batch.processedShipments && Array.isArray(batch.processedShipments)) {
            batch.processedShipments.forEach(summary => {
                processedShipmentIds.add(summary.shipmentId);
            });
        }
    });

    // 2. Filter the main shipments list to get only those that have been processed
    const shipmentsForInvoicing = allShipments.filter(shipment => 
        processedShipmentIds.has(shipment.id)
    );

    return shipmentsForInvoicing;
}

// Expedition Functions
export async function getExpeditions(): Promise<Expedition[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    let expeditions = getFromStorage<Expedition[]>('expeditions', null);
    if (expeditions === null) {
        saveToStorage('expeditions', initialExpeditions);
        expeditions = initialExpeditions;
    }
    return [...expeditions].sort((a,b) => a.name.localeCompare(b.name));
}

export async function addExpedition(name: string): Promise<Expedition> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const expeditions = await getExpeditions();
    if(expeditions.some(e => e.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Nama ekspedisi sudah ada.');
    }
    const newExpedition: Expedition = {
        id: `exp_${Date.now()}`,
        name: name,
    };
    const updatedExpeditions = [...expeditions, newExpedition];
    saveToStorage('expeditions', updatedExpeditions);
    return newExpedition;
}

export async function deleteExpedition(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    let expeditions = await getExpeditions();
    const updatedExpeditions = expeditions.filter(e => e.id !== id);
    if(expeditions.length === updatedExpeditions.length) {
        throw new Error('Ekspedisi tidak ditemukan.');
    }
    saveToStorage('expeditions', updatedExpeditions);
}
