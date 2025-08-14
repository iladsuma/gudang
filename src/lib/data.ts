'use client';

import type { User, Product, Shipment, Checkout, CheckoutItem } from '@/lib/types';

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
const initialShipments: Shipment[] = [
    {
        id: 'ship_1722885934988',
        user: 'Andi',
        transactionId: 'TRX-001',
        expedition: 'JNE Express',
        receipt: {
            fileName: 'resi_shopee_1.pdf',
            dataUrl: 'data:application/pdf;base64,JVBERi0xLjcgCiXi48/TIAoxIDAgb2JqIAo8PCAKL3R5cGUgL0NhdGFsb2cgCi9wYWdlcyAyIDAgUiAKPj4gCmVuZG9iagoyIDAgb2JqIAo8PCAKL3R5cGUgL1BhZ2VzIAovY291bnQgMSAKL2tpZHMgWyAzIDAgUiBdIAo+PiAKZW5kb2JqCjMgMCBvYmogCjw8IAovdHlwZSAvUGFnZSAKL3BhcmVudCAyIDAgUiAKL3Jlc291cmNlcyA8PCAKL2ZvbnQgPDwgCi9GMSA0IDAgUiAKPj4gCj4+IAovbWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdIAovY29udGVudHMgNSAwIFIgCj4+IAplbmRvYmoKNiAwIG9iagogPDwgCi9MZW5ndGggNTIgCi9GaWx0ZXIgL0ZsYXRlRGVjb2RlIAo+PiAKc3RyZWFtCnicK+ZyYGAEUnBnoiBDAwMDUwMUAxczEwMTAxs/FzE3Eyc3FzI3Oxs6AzYFBgYGBgY/jH6Y4wIAm9iAOKgYmZiZmFlYmlmYeBgYGBgAAAA//8AAnRleHQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqIAo8PCAKL0xlbmd0aCA2MiAKL0ZpbHRlciAvRmxhdGVEZWNvZGUgCj4+IApzdHJlYW0KeJwr5HAAAAAFgADCZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqIAo8PCAKL3R5cGUgL0ZvbnQgCi9zdWJ0eXBlIC9UeXBlMSAKL2Jhc2Vmb250IC9IZWx2ZXRpY2EgCi9lbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIAo+PiAKZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNyAwMDAwMCBuIAowMDAwMDAwMDY5IDAwMDAwIG4gCjAwMDAwMDAxMjggMDAwMDAgbiAKMDAwMDAwMzk4IDAwMDAwIG4gCjAwMDAwMDAzMjUgMDAwMDAgbiAKMDAwMDAwMTk0IDAwMDAwIG4gCnRyYWlsZXIKICA8PCAKL1Jvb3QgMSAwIFIgCi9TaXplIDcgCj4+IApzdGFydHhyZWYKNDc2CiUlRU9GCg=='
        },
        products: [
            { name: 'Mouse Nirkabel', quantity: 2 },
            { name: 'Keyboard Mekanikal', quantity: 1 }
        ],
        totalItems: 3,
        createdAt: '2024-08-05T12:25:34.988Z'
    },
    {
        id: 'ship_1722885987123',
        user: 'Budi',
        transactionId: 'TRX-002',
        expedition: 'SiCepat',
        receipt: {
            fileName: 'invoice_456.pdf',
            dataUrl: 'data:application/pdf;base64,JVBERi0xLjcgCiXi48/TIAoxIDAgb2JqIAo8PCAKL3R5cGUgL0NhdGFsb2cgCi9wYWdlcyAyIDAgUiAKPj4gCmVuZG9iagoyIDAgb2JqIAo8PCAKL3R5cGUgL1BhZ2VzIAovY291bnQgMSAKL2tpZHMgWyAzIDAgUiBdIAo+PiAKZW5kb2JqCjMgMCBvYmogCjw8IAovdHlwZSAvUGFnZSAKL3BhcmVudCAyIDAgUiAKL3Jlc291cmNlcyA8PCAKL2ZvbnQgPDwgCi9GMSA0IDAgUiAKPj4gCj4+IAovbWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdIAovY29udGVudHMgNSAwIFIgCj4+IAplbmRvYmoKNiAwIG9iagogPDwgCi9MZW5ndGggNTIgCi9GaWx0ZXIgL0ZsYXRlRGVjb2RlIAo+PiAKc3RyZWFtCnicK+ZyYGAEUnBnoiBDAwMDUwMUAxczEwMTAxs/FzE3Eyc3FzI3Oxs6AzYFBgYGBgY/jH6Y4wIAm9iAOKgYmZiZmFlYmlmYeBgYGBgAAAA//8AAnRleHQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqIAo8PCAKL0xlbmd0aCA2MiAKL0ZpbHRlciAvRmxhdGVEZWNvZGUgCj4+IApzdHJlYW0KeJwr5HAAAAAFgADCZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqIAo8PCAKL3R5cGUgL0ZvbnQgCi9zdWJ0eXBlIC9UeXBlMSAKL2Jhc2Vmb250IC9IZWx2ZXRpY2EgCi9lbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIAo+PiAKZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNyAwMDAwMCBuIAowMDAwMDAwMDY5IDAwMDAwIG4gCjAwMDAwMDAxMjggMDAwMDAgbiAKMDAwMDAwMzk4IDAwMDAwIG4gCjAwMDAwMDAzMjUgMDAwMDAgbiAKMDAwMDAwMTk0IDAwMDAwIG4gCnRyYWlsZXIKICA8PCAKL1Jvb3QgMSAwIFIgCi9TaXplIDcgCj4+IApzdGFydHhyZWYKNDc2CiUlRU9GCg=='
        },
        products: [
            { name: 'Monitor 4K 27-inci', quantity: 1 }
        ],
        totalItems: 1,
        createdAt: '2024-08-05T10:10:10.123Z'
    },
    {
        id: 'ship_1722886014567',
        user: 'Andi',
        transactionId: 'TRX-003',
        expedition: 'J&T Express',
        receipt: {
            fileName: 'resi_blibli_2.pdf',
            dataUrl: 'data:application/pdf;base64,JVBERi0xLjcgCiXi48/TIAoxIDAgb2JqIAo8PCAKL3R5cGUgL0NhdGFsb2cgCi9wYWdlcyAyIDAgUiAKPj4gCmVuZG9iagoyIDAgb2JqIAo8PCAKL3R5cGUgL1BhZ2VzIAovY291bnQgMSAKL2tpZHMgWyAzIDAgUiBdIAo+PiAKZW5kb2JqCjMgMCBvYmogCjw8IAovdHlwZSAvUGFnZSAKL3BhcmVudCAyIDAgUiAKL3Jlc291cmNlcyA8PCAKL2ZvbnQgPDwgCi9GMSA0IDAgUiAKPj4gCj4+IAovbWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdIAovY29udGVudHMgNSAwIFIgCj4+IAplbmRvYmoKNiAwIG9iagogPDwgCi9MZW5ndGggNTIgCi9GaWx0ZXIgL0ZsYXRlRGVjb2RlIAo+PiAKc3RyZWFtCnicK+ZyYGAEUnBnoiBDAwMDUwMUAxczEwMTAxs/FzE3Eyc3FzI3Oxs6AzYFBgYGBgY/jH6Y4wIAm9iAOKgYmZiZmFlYmlmYeBgYGBgAAAA//8AAnRleHQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqIAo8PCAKL0xlbmd0aCA2MiAKL0ZpbHRlciAvRmxhdGVEZWNvZGUgCj4+IApzdHJlYW0KeJwr5HAAAAAFgADCZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqIAo8PCAKL3R5cGUgL0ZvbnQgCi9zdWJ0eXBlIC9UeXBlMSAKL2Jhc2Vmb250IC9IZWx2ZXRpY2EgCi9lbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIAo+PiAKZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNyAwMDAwMCBuIAowMDAwMDAwMDY5IDAwMDAwIG4gCjAwMDAwMDAxMjggMDAwMDAgbiAKMDAwMDAwMzk4IDAwMDAwIG4gCjAwMDAwMDAzMjUgMDAwMDAgbiAKMDAwMDAwMTk0IDAwMDAwIG4gCnRyYWlsZXIKICA8PCAKL1Jvb3QgMSAwIFIgCi9TaXplIDcgCj4+IApzdGFydHhyZWYKNDc2CiUlRU9GCg=='
        },
        products: [
            { name: 'Hub USB-C', quantity: 5 },
            { name: 'Stand Laptop', quantity: 3 },
            { name: 'Webcam 1080p', quantity: 2 }
        ],
        totalItems: 10,
        createdAt: '2024-08-04T08:45:00.567Z'
    }
];

const initialUsers: User[] = [
    { id: 'usr_1', username: 'admin', name: 'Admin', role: 'admin' },
    { id: 'usr_2', username: 'user', name: 'User Biasa', role: 'user' },
];

const initialProducts: Product[] = [
  { id: '1', code: 'SKU001', name: 'Mouse Nirkabel', stock: 150, price: 250000 },
  { id: '2', code: 'SKU002', name: 'Keyboard Mekanikal', stock: 80, price: 750000 },
  { id: '3', code: 'SKU003', name: 'Monitor 4K 27-inci', stock: 50, price: 4500000 },
  { id: '4', code: 'SKU004', name: 'Hub USB-C', stock: 200, price: 350000 },
  { id: '5', code: 'SKU005', name: 'Webcam 1080p', stock: 120, price: 600000 },
  { id: '6', code: 'SKU006', name: 'Stand Laptop', stock: 300, price: 150000 },
  { id: '7', code: 'SKU007', name: 'Headphone Peredam Bising', stock: 75, price: 1200000 },
  { id: '8', code: 'SKU008', name: 'Kursi Ergonomis', stock: 25, price: 2500000 },
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
    if (user && user.username === password) { 
        return user;
    }
    throw new Error('Username atau password salah.');
}

// Product Functions
export async function getProducts(query?: string): Promise<Product[]> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
  const products = getFromStorage('products', initialProducts);
  let sortedProducts = [...products].sort((a,b) => a.name.localeCompare(b.name));
  if (!query) {
    return sortedProducts;
  }
  return sortedProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.code.toLowerCase().includes(query.toLowerCase())
  );
}

export async function getProductByCode(code: string): Promise<Product | undefined> {
    const products = getFromStorage('products', initialProducts);
    return products.find((p) => p.code.toLowerCase() === code.toLowerCase());
}


// Shipment Functions
export async function getShipments(): Promise<Shipment[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const shipments = getFromStorage('shipments', initialShipments);
  return [...shipments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addShipment(data: Omit<Shipment, 'id' | 'createdAt' | 'totalItems'>): Promise<Shipment> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const shipments = getFromStorage('shipments', initialShipments);

  if (shipments.some(s => s.transactionId.toLowerCase() === data.transactionId.toLowerCase())) {
    throw new Error('ID Transaksi harus unik.');
  }

  const newShipment: Shipment = {
    ...data,
    id: `ship_${Date.now()}`,
    createdAt: new Date().toISOString(),
    totalItems: data.products.reduce((sum, p) => sum + p.quantity, 0),
  };
  
  const updatedShipments = [newShipment, ...shipments];
  saveToStorage('shipments', updatedShipments);

  return newShipment;
}

export async function deleteShipment(shipmentId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    let shipments = getFromStorage('shipments', initialShipments);
    const updatedShipments = shipments.filter(s => s.id !== shipmentId);
    
    if (shipments.length === updatedShipments.length) {
        throw new Error('Pengiriman tidak ditemukan.');
    }
    
    saveToStorage('shipments', updatedShipments);
}

// History/Checkout Functions
export async function processAndMoveToHistory(shipmentIds: string[]): Promise<Checkout[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    let shipments = getFromStorage('shipments', initialShipments);
    let checkoutHistory = getFromStorage<Checkout[]>('checkoutHistory', []);
    
    const shipmentsToProcess = shipments.filter(s => shipmentIds.includes(s.id));
    const newHistoryItems: Checkout[] = [];

    for (const shipment of shipmentsToProcess) {
        if (checkoutHistory.some(c => c.transactionId === shipment.transactionId)) {
            continue; // Skip if already in history
        }

        const newCheckout: Checkout = {
            id: `checkout_${Date.now()}_${shipment.id}`,
            transactionId: shipment.transactionId,
            customerName: shipment.user, 
            items: shipment.products.map(p => ({
                code: p.name, // Assuming name is unique enough for this context
                name: p.name,
                quantity: p.quantity,
                price: 0, // Price data is not in the shipment
                stock: 0, // Stock data is not relevant for a history item
            })),
            totalItems: shipment.totalItems,
            totalAmount: 0, // Amount data is not in the shipment
            createdAt: shipment.createdAt,
        };
        newHistoryItems.push(newCheckout);
    }
    
    if (newHistoryItems.length > 0) {
        const updatedHistory = [...newHistoryItems, ...checkoutHistory];
        const updatedShipments = shipments.filter(s => !shipmentIds.includes(s.id));
        
        saveToStorage('checkoutHistory', updatedHistory);
        saveToStorage('shipments', updatedShipments);
    }
    
    return newHistoryItems;
}


export async function getCheckoutHistory(): Promise<Checkout[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const history = getFromStorage<Checkout[]>('checkoutHistory', []);
    return [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
