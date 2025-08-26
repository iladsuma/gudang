

'use client';

import type { User, Shipment, Checkout, Expedition, Product, Packaging, Customer, StockMovement, Supplier } from '@/lib/types';
import { initialData } from './initial-data';


// =================================================================
// Local Storage Simulation
// =================================================================

let db: {
  users: User[];
  products: Product[];
  expeditions: Expedition[];
  packagingOptions: Packaging[];
  shipments: Shipment[];
  checkoutHistory: Checkout[];
  customers: Customer[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
} = {
  users: [],
  products: [],
  expeditions: [],
  packagingOptions: [],
  shipments: [],
  checkoutHistory: [],
  customers: [],
  suppliers: [],
  stockMovements: [],
};


// Function to initialize or load data from localStorage
function initializeDb() {
  if (typeof window !== 'undefined') {
    const storedDb = localStorage.getItem('gudangcheckout_db');
    if (storedDb) {
      try {
        db = JSON.parse(storedDb);
        // Basic validation to ensure all keys are present after parsing
        const requiredKeys: (keyof typeof db)[] = ['users', 'products', 'expeditions', 'packagingOptions', 'shipments', 'checkoutHistory', 'customers', 'suppliers', 'stockMovements'];
        let needsReset = false;
        for (const key of requiredKeys) {
            if (!db[key]) {
                console.warn(`Database in localStorage is missing key: ${key}. Resetting.`);
                needsReset = true;
                break;
            }
        }
        if (needsReset) {
             localStorage.removeItem('gudangcheckout_db');
             db = JSON.parse(JSON.stringify(initialData));
             localStorage.setItem('gudangcheckout_db', JSON.stringify(db));
        }

      } catch (error) {
        console.error("Failed to parse DB from localStorage, resetting.", error);
        db = JSON.parse(JSON.stringify(initialData));
        localStorage.setItem('gudangcheckout_db', JSON.stringify(db));
      }
    } else {
      // Deep copy to avoid modifying the original initialData object
      db = JSON.parse(JSON.stringify(initialData));
      localStorage.setItem('gudangcheckout_db', JSON.stringify(db));
    }
  } else {
     // For server-side rendering or environments without window, use initial data without saving.
     db = JSON.parse(JSON.stringify(initialData));
  }
}


function persistDb() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gudangcheckout_db', JSON.stringify(db));
  }
}

// Initialize the database when this module is loaded
initializeDb();


// =================================================================
// Data Access Functions
// =================================================================


// --- User Functions ---
export function getDummyUsers(): User[] {
  // This is used for the auth context, which also checks localStorage
  return db.users;
}

export async function login(username: string, password: string): Promise<User> {
  return new Promise((resolve, reject) => {
    const user = db.users.find(u => u.username === username);
    if (user && user.password === password) {
      const { password, ...userToReturn } = user;
      resolve(userToReturn);
    } else {
      reject(new Error('Username atau password salah.'));
    }
  });
}

export async function getUsers(): Promise<User[]> {
    return Promise.resolve(db.users.map(u => {
        const { password, ...user } = u;
        return user;
    }));
}

export async function addUser(data: Omit<User, 'id'>): Promise<User> {
    if (db.users.some(u => u.username.toLowerCase() === data.username.toLowerCase())) {
        throw new Error('Username sudah digunakan.');
    }
    const newUser: User = {
        ...data,
        id: `usr_${Date.now()}_${Math.random()}`,
    };
    db.users.push(newUser);
    persistDb();
    const { password, ...userToReturn } = newUser;
    return Promise.resolve(userToReturn);
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User> {
    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
        throw new Error('Pengguna tidak ditemukan.');
    }
    if (data.username && db.users.some(u => u.id !== id && u.username.toLowerCase() === data.username.toLowerCase())) {
        throw new Error('Username lain dengan nama ini sudah ada.');
    }

    if (!data.password) {
        delete data.password;
    }

    const updatedUser = { ...db.users[userIndex], ...data };
    db.users[userIndex] = updatedUser;
    persistDb();
    const { password, ...userToReturn } = updatedUser;
    return Promise.resolve(userToReturn);
}

export async function deleteUser(id: string): Promise<void> {
    const userToDelete = db.users.find((u) => u.id === id);
    if(userToDelete?.role === 'admin') {
        const adminCount = db.users.filter((u) => u.role === 'admin').length;
        if(adminCount <= 1) {
            throw new Error('Tidak dapat menghapus admin terakhir.');
        }
    }

    db.users = db.users.filter(u => u.id !== id);
    persistDb();
    return Promise.resolve();
}

// --- Customer Functions ---
export async function getCustomers(): Promise<Customer[]> {
    const sorted = [...db.customers].sort((a,b) => a.name.localeCompare(b.name));
    return Promise.resolve(sorted);
}

export async function addCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
    if (db.customers.some(c => c.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('Nama pelanggan sudah ada.');
    }
    const newCustomer: Customer = { ...data, id: `cust_${Date.now()}` };
    db.customers.push(newCustomer);
    persistDb();
    return Promise.resolve(newCustomer);
}

export async function updateCustomer(id: string, data: Omit<Customer, 'id'>): Promise<Customer> {
    const customerIndex = db.customers.findIndex(c => c.id === id);
    if (customerIndex === -1) {
        throw new Error('Pelanggan tidak ditemukan.');
    }
     if (db.customers.some(c => c.id !== id && c.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('Nama pelanggan lain dengan nama ini sudah ada.');
    }
    db.customers[customerIndex] = { ...db.customers[customerIndex], ...data };
    persistDb();
    return Promise.resolve(db.customers[customerIndex]);
}

export async function deleteCustomer(id: string): Promise<void> {
    db.customers = db.customers.filter(c => c.id !== id);
    persistDb();
    return Promise.resolve();
}

// --- Supplier Functions ---
export async function getSuppliers(): Promise<Supplier[]> {
    const sorted = [...db.suppliers].sort((a,b) => a.name.localeCompare(b.name));
    return Promise.resolve(sorted);
}

export async function addSupplier(data: Omit<Supplier, 'id'>): Promise<Supplier> {
    if (db.suppliers.some(s => s.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('Nama supplier sudah ada.');
    }
    const newSupplier: Supplier = { ...data, id: `sup_${Date.now()}` };
    db.suppliers.push(newSupplier);
    persistDb();
    return Promise.resolve(newSupplier);
}

export async function updateSupplier(id: string, data: Omit<Supplier, 'id'>): Promise<Supplier> {
    const supplierIndex = db.suppliers.findIndex(s => s.id === id);
    if (supplierIndex === -1) {
        throw new Error('Supplier tidak ditemukan.');
    }
     if (db.suppliers.some(s => s.id !== id && s.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('Nama supplier lain dengan nama ini sudah ada.');
    }
    db.suppliers[supplierIndex] = { ...db.suppliers[supplierIndex], ...data };
    persistDb();
    return Promise.resolve(db.suppliers[supplierIndex]);
}

export async function deleteSupplier(id: string): Promise<void> {
    db.suppliers = db.suppliers.filter(s => s.id !== id);
    persistDb();
    return Promise.resolve();
}


// --- Shipment Functions ---
export async function getShipments(): Promise<Shipment[]> {
    const sorted = [...db.shipments].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return Promise.resolve(sorted);
}

export async function addShipment(data: Omit<Shipment, 'id' | 'createdAt' | 'status' | 'totalItems' | 'totalAmount' | 'totalProductCost' | 'totalPackingCost'> & { packagingCost: number }): Promise<Shipment> {
    const totalItems = data.products.reduce((sum, p) => sum + p.quantity, 0);
    const totalProductCost = data.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const totalPackingCost = data.packagingCost || 0;
    const grandTotal = totalProductCost + totalPackingCost;

    const newShipment: Shipment = {
        ...data,
        id: `ship_${Date.now()}_${Math.random()}`,
        status: 'Proses',
        createdAt: new Date().toISOString(),
        totalItems,
        totalProductCost,
        totalPackingCost,
        totalAmount: grandTotal,
        products: data.products.map(p => ({ ...p }))
    };

    db.shipments.unshift(newShipment);
    persistDb();
    return Promise.resolve(newShipment);
}

export async function updateShipment(shipmentId: string, data: Omit<Shipment, 'id' | 'createdAt' | 'status' | 'totalItems' | 'totalAmount' | 'totalProductCost' | 'totalPackingCost'> & { packagingCost: number }): Promise<Shipment> {
    const shipmentIndex = db.shipments.findIndex(s => s.id === shipmentId);
    if (shipmentIndex === -1) {
        throw new Error("Pengiriman tidak ditemukan.");
    }
    const originalShipment = db.shipments[shipmentIndex];
    if (originalShipment.status !== 'Proses') {
        throw new Error("Hanya pengiriman dengan status 'Proses' yang bisa diubah.");
    }

    const totalItems = data.products.reduce((sum, p) => sum + p.quantity, 0);
    const totalProductCost = data.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const totalPackingCost = data.packagingCost || 0;
    const grandTotal = totalProductCost + totalPackingCost;
    
    const updatedShipment: Shipment = {
        ...originalShipment,
        ...data,
        totalItems,
        totalProductCost,
        totalPackingCost,
        totalAmount: grandTotal,
        products: data.products.map(p => ({ ...p }))
    };

    db.shipments[shipmentIndex] = updatedShipment;
    persistDb();
    return Promise.resolve(updatedShipment);
}

export async function deleteShipment(shipmentId: string): Promise<void> {
    db.shipments = db.shipments.filter(s => s.id !== shipmentId);
    persistDb();
    return Promise.resolve();
}


// --- History/Checkout Functions ---
export async function processShipmentsToPackaging(shipmentIds: string[]): Promise<void> {
  const shipmentsToProcess = db.shipments.filter(s => shipmentIds.includes(s.id));
  
  if (shipmentsToProcess.length === 0) {
    throw new Error("Tidak ada pengiriman yang valid untuk diproses.");
  }
  
  if (shipmentsToProcess.some(s => s.status !== 'Proses')) {
      throw new Error("Hanya pengiriman dengan status 'Proses' yang bisa dibungkus.");
  }

  // Stock Deduction Logic
  const productStockUpdates: { [productId: string]: { newStock: number, originalStock: number, quantityChange: number } } = {};

  for (const shipment of shipmentsToProcess) {
    for (const product of shipment.products) {
      const masterProduct = db.products.find(p => p.id === product.productId);
      if (!masterProduct) {
        throw new Error(`Produk dengan kode "${product.code}" tidak ditemukan di database.`);
      }
      
      const currentStock = (productStockUpdates[product.productId] !== undefined) 
          ? productStockUpdates[product.productId].newStock
          : masterProduct.stock;

      const stockAfterThisTx = currentStock - product.quantity;

      if (stockAfterThisTx < 0) {
        throw new Error(`Stok tidak mencukupi untuk produk "${product.name}". Stok sisa: ${currentStock}, dibutuhkan: ${product.quantity}.`);
      }
      
      // Accumulate changes if the same product is in multiple shipments
      const existingChange = productStockUpdates[product.productId]?.quantityChange || 0;
      productStockUpdates[product.productId] = {
          newStock: stockAfterThisTx,
          originalStock: masterProduct.stock, // Store the very original stock
          quantityChange: existingChange + product.quantity
      };

       // Record stock movement for this specific product in this shipment
        const movement: StockMovement = {
            id: `sm_${Date.now()}_${Math.random()}`,
            productId: product.productId,
            referenceId: shipment.id,
            type: 'Penjualan',
            quantityChange: -product.quantity,
            stockBefore: currentStock,
            stockAfter: stockAfterThisTx,
            notes: `Penjualan dari transaksi ${shipment.transactionId}`,
            createdAt: new Date().toISOString(),
        };
        db.stockMovements.push(movement);
    }
  }

  // Apply final stock updates to master products
  db.products.forEach((p, index) => {
    if (productStockUpdates[p.id] !== undefined) {
      db.products[index].stock = productStockUpdates[p.id].newStock;
    }
  });

  // Update shipment statuses
  db.shipments.forEach((s, index) => {
    if (shipmentIds.includes(s.id)) {
      db.shipments[index].status = 'Pengemasan';
    }
  });
  
  persistDb();
  return Promise.resolve();
}


export async function processShipmentsToDelivered(shipmentIds: string[]): Promise<void> {
  const shipmentsToProcess = db.shipments.filter(s => shipmentIds.includes(s.id));
  
  if (shipmentsToProcess.length === 0) {
    throw new Error("Tidak ada pengiriman yang valid untuk diproses.");
  }
  
  if (shipmentsToProcess.some(s => s.status !== 'Pengemasan')) {
    throw new Error("Hanya pengiriman dengan status 'Pengemasan' yang bisa dikirim.");
  }

  // Note: In a real app, user would come from an authenticated session.
  // Here we'll just hardcode or assume an admin user.
  const processorName = "Admin"; 

  const processedSummaries = shipmentsToProcess.map(s => ({
    shipmentId: s.id,
    transactionId: s.transactionId,
    totalAmount: s.totalAmount,
    totalItems: s.totalItems,
  }));

  const totalBatchAmount = processedSummaries.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalBatchItems = processedSummaries.reduce((sum, s) => sum + s.totalItems, 0);

  const newBatchCheckout: Checkout = {
    id: `batch_${Date.now()}`,
    processorName: processorName,
    processedShipments: processedSummaries,
    totalBatchItems: totalBatchItems,
    totalBatchAmount: totalBatchAmount,
    createdAt: new Date().toISOString(),
  };

  db.checkoutHistory.unshift(newBatchCheckout);

  // Update status to 'Terkirim'
  db.shipments.forEach((s, index) => {
    if (shipmentIds.includes(s.id)) {
      db.shipments[index].status = 'Terkirim';
    }
  });
  
  persistDb();
  return Promise.resolve();
}


export async function getCheckoutHistory(): Promise<Checkout[]> {
    const sorted = [...db.checkoutHistory].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return Promise.resolve(sorted);
}


// --- Expedition Functions ---
export async function getExpeditions(): Promise<Expedition[]> {
    const sorted = [...db.expeditions].sort((a, b) => a.name.localeCompare(b.name));
    return Promise.resolve(sorted);
}

export async function addExpedition(name: string): Promise<Expedition> {
    if (db.expeditions.some(e => e.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Nama ekspedisi sudah ada.');
    }
    const newExpedition: Expedition = { id: `exp_${Date.now()}`, name };
    db.expeditions.push(newExpedition);
    persistDb();
    return Promise.resolve(newExpedition);
}

export async function updateExpedition(id: string, name: string): Promise<Expedition> {
    const expeditionIndex = db.expeditions.findIndex(e => e.id === id);
    if (expeditionIndex === -1) {
        throw new Error('Ekspedisi tidak ditemukan.');
    }
    if (db.expeditions.some(e => e.id !== id && e.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Nama ekspedisi lain dengan nama ini sudah ada.');
    }
    db.expeditions[expeditionIndex].name = name;
    persistDb();
    return Promise.resolve(db.expeditions[expeditionIndex]);
}

export async function deleteExpedition(id: string): Promise<void> {
    db.expeditions = db.expeditions.filter(e => e.id !== id);
    persistDb();
    return Promise.resolve();
}

// --- Master Product Functions ---
export async function getProducts(): Promise<Product[]> {
    const sorted = [...db.products].sort((a,b) => a.name.localeCompare(b.name));
    return Promise.resolve(sorted);
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    if (db.products.some(p => p.name.toLowerCase() === product.name.toLowerCase())) {
        throw new Error('Nama produk sudah ada.');
    }
    if (db.products.some(p => p.code.toLowerCase() === product.code.toLowerCase())) {
        throw new Error('Kode produk sudah ada.');
    }
    const newProduct: Product = { ...product, id: `prod_${Date.now()}` };
    db.products.push(newProduct);
    
    // Add initial stock movement
    const movement: StockMovement = {
        id: `sm_${Date.now()}_${Math.random()}`,
        productId: newProduct.id,
        type: 'Stok Awal',
        quantityChange: newProduct.stock,
        stockBefore: 0,
        stockAfter: newProduct.stock,
        notes: 'Stok awal saat produk dibuat',
        createdAt: new Date().toISOString(),
    };
    db.stockMovements.push(movement);
    
    persistDb();
    return Promise.resolve(newProduct);
}

export async function updateProduct(id: string, productUpdate: Omit<Product, 'id'>): Promise<Product> {
    const productIndex = db.products.findIndex(p => p.id === id);
    if (productIndex === -1) {
        throw new Error('Produk tidak ditemukan.');
    }
    if (db.products.some(p => p.id !== id && p.name.toLowerCase() === productUpdate.name.toLowerCase())) {
        throw new Error('Nama produk lain dengan nama ini sudah ada.');
    }
     if (db.products.some(p => p.id !== id && p.code.toLowerCase() === productUpdate.code.toLowerCase())) {
        throw new Error('Kode produk lain dengan nama ini sudah ada.');
    }
    
    const originalProduct = db.products[productIndex];
    // Prevent stock from being updated through this function
    const payload = { ...productUpdate, stock: originalProduct.stock };
    
    db.products[productIndex] = { ...originalProduct, ...payload };
    persistDb();
    return Promise.resolve(db.products[productIndex]);
}

export async function deleteProduct(id: string): Promise<void> {
    db.products = db.products.filter(p => p.id !== id);
    // Optionally, also delete related stock movements
    db.stockMovements = db.stockMovements.filter(sm => sm.productId !== id);
    persistDb();
    return Promise.resolve();
}

export async function updateProductStock(id: string, newStock: number): Promise<Product> {
    const productIndex = db.products.findIndex(p => p.id === id);
    if (productIndex === -1) {
        throw new Error('Produk tidak ditemukan.');
    }
    
    const product = db.products[productIndex];
    const oldStock = product.stock;

    if(oldStock === newStock) return Promise.resolve(product); // No change

    // Record stock opname movement
    const movement: StockMovement = {
        id: `sm_${Date.now()}_${Math.random()}`,
        productId: id,
        type: 'Stok Opname',
        quantityChange: newStock - oldStock,
        stockBefore: oldStock,
        stockAfter: newStock,
        notes: 'Penyesuaian stok manual',
        createdAt: new Date().toISOString(),
    };
    db.stockMovements.push(movement);
    
    db.products[productIndex].stock = newStock;
    persistDb();
    return Promise.resolve(db.products[productIndex]);
}

export async function getStockMovements(productId: string): Promise<StockMovement[]> {
    const movements = db.stockMovements
        .filter(sm => sm.productId === productId)
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return Promise.resolve(movements);
}


// --- Packaging Functions ---
export async function getPackagingOptions(): Promise<Packaging[]> {
    const sorted = [...db.packagingOptions].sort((a,b) => a.name.localeCompare(b.name));
    return Promise.resolve(sorted);
}

export async function addPackagingOption(data: Omit<Packaging, 'id'>): Promise<Packaging> {
    if (db.packagingOptions.some(o => o.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('Nama kemasan sudah ada.');
    }
    const newOption: Packaging = { ...data, id: `pkg_${Date.now()}` };
    db.packagingOptions.push(newOption);
    persistDb();
    return Promise.resolve(newOption);
}

export async function updatePackagingOption(id: string, data: Omit<Packaging, 'id'>): Promise<Packaging> {
    const optionIndex = db.packagingOptions.findIndex(o => o.id === id);
    if (optionIndex === -1) {
        throw new Error('Tipe kemasan tidak ditemukan.');
    }
    if (db.packagingOptions.some(o => o.id !== id && o.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('Tipe kemasan lain dengan nama ini sudah ada.');
    }
    db.packagingOptions[optionIndex] = { ...db.packagingOptions[optionIndex], ...data };
    persistDb();
    return Promise.resolve(db.packagingOptions[optionIndex]);
}

export async function deletePackagingOption(id: string): Promise<void> {
    db.packagingOptions = db.packagingOptions.filter(o => o.id !== id);
    persistDb();
    return Promise.resolve();
}
