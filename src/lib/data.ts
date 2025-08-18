
'use client';

import type { User, Shipment, Checkout, ProcessedShipmentSummary, Expedition, Product, Packaging } from '@/lib/types';

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

const initialProducts: Product[] = [
    { id: 'prod_1', code: 'BA-001', name: 'Baju Anak', price: 50000, stock: 100, imageUrl: 'https://placehold.co/100x100.png' },
    { id: 'prod_2', code: 'CP-001', name: 'Celana Panjang', price: 120000, stock: 50, imageUrl: 'https://placehold.co/100x100.png' },
    { id: 'prod_3', code: 'TP-001', name: 'Topi', price: 35000, stock: 75, imageUrl: 'https://placehold.co/100x100.png' },
]

const initialPackaging: Packaging[] = [
    { id: 'pkg_1', name: 'Plastik', cost: 500 },
    { id: 'pkg_2', name: 'Kardus Kecil', cost: 1500 },
    { id: 'pkg_3', name: 'Kardus + Bubble Wrap', cost: 3000 },
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


export async function addShipment(data: Omit<Shipment, 'id' | 'createdAt' | 'totalItems' | 'totalAmount' | 'totalPackingCost' | 'totalProductCost'>): Promise<Shipment> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const shipments = await getShipments();

  if (shipments.some(s => s.transactionId.toLowerCase() === data.transactionId.toLowerCase())) {
    throw new Error('ID Transaksi harus unik.');
  }

  // Stock deduction is moved to processShipments
  // const allProducts = await getProducts();
  // for (const p of data.products) {
  //   if (!p.productId) continue;
  //   const productInDb = allProducts.find(dbP => dbP.id === p.productId);
  //   if (productInDb && productInDb.stock < p.quantity) {
  //       throw new Error(`Stok tidak mencukupi untuk produk "${p.name}". Sisa stok: ${productInDb.stock}.`);
  //   }
  //   if (productInDb) {
  //       await updateProductStock(p.productId, productInDb.stock - p.quantity);
  //   }
  // }

  const totalItems = data.products.reduce((sum, p) => sum + p.quantity, 0);
  
  const totalProductCost = data.products.reduce((sum, p) => {
    const subtotal = (p.price * p.quantity) - p.discount;
    return sum + subtotal;
  }, 0);
  
  const totalPackingCost = data.products.reduce((sum, p) => sum + (p.packagingCost * p.quantity), 0);

  const grandTotal = totalProductCost + totalPackingCost;

  const newShipment: Shipment = {
    ...data,
    id: `ship_${Date.now()}_${Math.random()}`,
    createdAt: new Date().toISOString(),
    totalItems,
    totalProductCost,
    totalPackingCost,
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

    // --- New Stock Deduction Logic ---
    const allMasterProducts = await getProducts();
    const productStockUpdates: { [productId: string]: number } = {};

    // First, check if all stocks are sufficient
    for (const shipment of shipmentsToProcess) {
        for (const product of shipment.products) {
            const masterProduct = allMasterProducts.find(p => p.id === product.productId);
            if (!masterProduct) {
                throw new Error(`Produk dengan kode "${product.code}" tidak ditemukan di database.`);
            }
            const currentStock = masterProduct.stock;
            const stockNeeded = product.quantity;
            const stockAfterThisTx = (productStockUpdates[product.productId] ?? currentStock) - stockNeeded;

            if (stockAfterThisTx < 0) {
                throw new Error(`Stok tidak mencukupi untuk produk "${product.name}". Stok sisa: ${currentStock}, dibutuhkan: ${stockNeeded}.`);
            }
            productStockUpdates[product.productId] = stockAfterThisTx;
        }
    }

    // If all stocks are sufficient, proceed to update them
    for (const productId in productStockUpdates) {
        await updateProductStock(productId, productStockUpdates[productId]);
    }
    // --- End of New Stock Deduction Logic ---


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
    
    // Remove processed shipments from the main list
    const remainingShipments = shipments.filter(s => !shipmentIds.includes(s.id));
    saveToStorage('shipments', remainingShipments);
    
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

export async function updateExpedition(id: string, name: string): Promise<Expedition> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const expeditions = await getExpeditions();
    const expeditionIndex = expeditions.findIndex(e => e.id === id);

    if (expeditionIndex === -1) {
        throw new Error('Ekspedisi tidak ditemukan.');
    }

    // Check if another expedition already has the new name (case-insensitive), excluding the current one
    if (expeditions.some(e => e.id !== id && e.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Nama ekspedisi lain dengan nama ini sudah ada.');
    }

    const updatedExpedition = { ...expeditions[expeditionIndex], name };
    expeditions[expeditionIndex] = updatedExpedition;
    
    saveToStorage('expeditions', expeditions);
    return updatedExpedition;
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


// Master Product Functions
export async function getProducts(): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    let products = getFromStorage<Product[]>('products', null);
    if (products === null) {
        saveToStorage('products', initialProducts);
        products = initialProducts;
    }
    return [...products].sort((a,b) => a.name.localeCompare(b.name));
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const products = await getProducts();
    if(products.some(p => p.name.toLowerCase() === product.name.toLowerCase())) {
        throw new Error('Nama produk sudah ada.');
    }
    if(products.some(p => p.code.toLowerCase() === product.code.toLowerCase())) {
        throw new Error('Kode produk sudah ada.');
    }
    const newProduct: Product = {
        ...product,
        id: `prod_${Date.now()}`,
    };
    const updatedProducts = [...products, newProduct];
    saveToStorage('products', updatedProducts);
    return newProduct;
}


export async function updateProduct(id: string, productUpdate: Omit<Product, 'id'>): Promise<Product> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const products = await getProducts();
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        throw new Error('Produk tidak ditemukan.');
    }

    if (products.some(p => p.id !== id && p.name.toLowerCase() === productUpdate.name.toLowerCase())) {
        throw new Error('Nama produk lain dengan nama ini sudah ada.');
    }

    if (products.some(p => p.id !== id && p.code.toLowerCase() === productUpdate.code.toLowerCase())) {
        throw new Error('Kode produk lain dengan nama ini sudah ada.');
    }

    const updatedProduct = { ...products[productIndex], ...productUpdate };
    products[productIndex] = updatedProduct;

    saveToStorage('products', products);
    return updatedProduct;
}


export async function deleteProduct(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    let products = await getProducts();
    const updatedProducts = products.filter(p => p.id !== id);
    if(products.length === updatedProducts.length) {
        throw new Error('Produk tidak ditemukan.');
    }
    saveToStorage('products', updatedProducts);
}

export async function updateProductStock(id: string, newStock: number): Promise<Product> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const products = await getProducts();
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        throw new Error('Produk tidak ditemukan.');
    }

    const updatedProduct = { ...products[productIndex], stock: newStock };
    products[productIndex] = updatedProduct;

    saveToStorage('products', products);
    return updatedProduct;
}

// Packaging Functions
export async function getPackagingOptions(): Promise<Packaging[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    let options = getFromStorage<Packaging[]>('packagingOptions', null);
    if (options === null) {
        saveToStorage('packagingOptions', initialPackaging);
        options = initialPackaging;
    }
    return [...options].sort((a,b) => a.name.localeCompare(b.name));
}

export async function addPackagingOption(data: Omit<Packaging, 'id'>): Promise<Packaging> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const options = await getPackagingOptions();
    if(options.some(o => o.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('Nama kemasan sudah ada.');
    }
    const newOption: Packaging = {
        ...data,
        id: `pkg_${Date.now()}`,
    };
    const updatedOptions = [...options, newOption];
    saveToStorage('packagingOptions', updatedOptions);
    return newOption;
}

export async function updatePackagingOption(id: string, data: Omit<Packaging, 'id'>): Promise<Packaging> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const options = await getPackagingOptions();
    const optionIndex = options.findIndex(o => o.id === id);

    if (optionIndex === -1) {
        throw new Error('Tipe kemasan tidak ditemukan.');
    }
    if (options.some(o => o.id !== id && o.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('Tipe kemasan lain dengan nama ini sudah ada.');
    }

    const updatedOption = { ...options[optionIndex], ...data };
    options[optionIndex] = updatedOption;
    
    saveToStorage('packagingOptions', options);
    return updatedOption;
}

export async function deletePackagingOption(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    let options = await getPackagingOptions();
    const updatedOptions = options.filter(o => o.id !== id);
    if(options.length === updatedOptions.length) {
        throw new Error('Tipe kemasan tidak ditemukan.');
    }
    saveToStorage('packagingOptions', updatedOptions);
}
