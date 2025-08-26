

'use client';

import type { User, Shipment, Checkout, Expedition, Product, Packaging, Customer, StockMovement, Supplier, Purchase, PurchaseProduct, ShipmentProduct, Return, ReturnedProduct } from './types';
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
  purchases: Purchase[];
  returns: Return[];
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
  purchases: [],
  returns: [],
};


// Function to initialize or load data from localStorage
function initializeDb() {
  if (typeof window !== 'undefined') {
    const storedDb = localStorage.getItem('gudangcheckout_db');
    if (storedDb) {
      try {
        db = JSON.parse(storedDb);
        // Basic validation to ensure all keys are present after parsing
        const requiredKeys: (keyof typeof db)[] = ['users', 'products', 'expeditions', 'packagingOptions', 'shipments', 'checkoutHistory', 'customers', 'suppliers', 'stockMovements', 'purchases', 'returns'];
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
    const sorted = [...(db.customers || [])].sort((a,b) => a.name.localeCompare(b.name));
    return Promise.resolve(sorted);
}

export async function addCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
    if (!db.customers) db.customers = [];
    if (db.customers.some(c => c.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('Nama pelanggan sudah ada.');
    }
    const newCustomer: Customer = { ...data, id: `cust_${Date.now()}` };
    db.customers.push(newCustomer);
    persistDb();
    return Promise.resolve(newCustomer);
}

export async function updateCustomer(id: string, data: Omit<Customer, 'id'>): Promise<Customer> {
    if (!db.customers) db.customers = [];
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
    if (!db.customers) db.customers = [];
    db.customers = db.customers.filter(c => c.id !== id);
    persistDb();
    return Promise.resolve();
}

// --- Supplier Functions ---
export async function getSuppliers(): Promise<Supplier[]> {
    const sorted = [...(db.suppliers || [])].sort((a,b) => a.name.localeCompare(b.name));
    return Promise.resolve(sorted);
}

export async function addSupplier(data: Omit<Supplier, 'id'>): Promise<Supplier> {
    if (!db.suppliers) db.suppliers = [];
    if (db.suppliers.some(s => s.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('Nama supplier sudah ada.');
    }
    const newSupplier: Supplier = { ...data, id: `sup_${Date.now()}` };
    db.suppliers.push(newSupplier);
    persistDb();
    return Promise.resolve(newSupplier);
}

export async function updateSupplier(id: string, data: Omit<Supplier, 'id'>): Promise<Supplier> {
    if (!db.suppliers) db.suppliers = [];
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
    if (!db.suppliers) db.suppliers = [];
    db.suppliers = db.suppliers.filter(s => s.id !== id);
    persistDb();
    return Promise.resolve();
}


// --- Shipment Functions ---
export async function getShipments(): Promise<Shipment[]> {
    const sorted = [...(db.shipments || [])].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return Promise.resolve(sorted);
}

export async function addShipment(data: Omit<Shipment, 'id' | 'createdAt' | 'status' | 'totalItems' | 'totalAmount' | 'totalProductCost' | 'totalPackingCost' | 'customerName'> & { packagingCost: number }): Promise<Shipment> {
    const totalItems = data.products.reduce((sum, p) => sum + p.quantity, 0);
    const totalProductCost = data.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const totalPackingCost = data.packagingCost || 0;
    const grandTotal = totalProductCost + totalPackingCost;
    const customer = db.customers.find(c => c.id === data.customerId);

    const newShipment: Shipment = {
        ...data,
        id: `ship_${Date.now()}_${Math.random()}`,
        status: 'Proses',
        customerName: customer?.name || 'Pelanggan Umum',
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

export async function updateShipment(shipmentId: string, data: Omit<Shipment, 'id' | 'createdAt' | 'status' | 'totalItems' | 'totalAmount' | 'totalProductCost' | 'totalPackingCost' | 'customerName'> & { packagingCost: number }): Promise<Shipment> {
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
    const customer = db.customers.find(c => c.id === data.customerId);
    
    const updatedShipment: Shipment = {
        ...originalShipment,
        ...data,
        customerName: customer?.name || 'Pelanggan Umum',
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
    const sorted = [...(db.checkoutHistory || [])].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return Promise.resolve(sorted);
}


// --- Expedition Functions ---
export async function getExpeditions(): Promise<Expedition[]> {
    const sorted = [...(db.expeditions || [])].sort((a, b) => a.name.localeCompare(b.name));
    return Promise.resolve(sorted);
}

export async function addExpedition(name: string): Promise<Expedition> {
    if (!db.expeditions) db.expeditions = [];
    if (db.expeditions.some(e => e.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Nama ekspedisi sudah ada.');
    }
    const newExpedition: Expedition = { id: `exp_${Date.now()}`, name };
    db.expeditions.push(newExpedition);
    persistDb();
    return Promise.resolve(newExpedition);
}

export async function updateExpedition(id: string, name: string): Promise<Expedition> {
    if (!db.expeditions) db.expeditions = [];
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
    if (!db.expeditions) db.expeditions = [];
    db.expeditions = db.expeditions.filter(e => e.id !== id);
    persistDb();
    return Promise.resolve();
}

// --- Master Product Functions ---
export async function getProducts(): Promise<Product[]> {
    const sorted = [...(db.products || [])].sort((a,b) => a.name.localeCompare(b.name));
    return Promise.resolve(sorted);
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    if (!db.products) db.products = [];
    if (db.products.some(p => p.name.toLowerCase() === product.name.toLowerCase())) {
        throw new Error('Nama produk sudah ada.');
    }
    if (db.products.some(p => p.code.toLowerCase() === product.code.toLowerCase())) {
        throw new Error('Kode produk sudah ada.');
    }
    const newProduct: Product = { ...product, id: `prod_${Date.now()}` };
    db.products.push(newProduct);
    
    // Add initial stock movement
    if(newProduct.stock > 0) {
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
    }
    
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
    const movements = (db.stockMovements || [])
        .filter(sm => sm.productId === productId)
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return Promise.resolve(movements);
}


// --- Packaging Functions ---
export async function getPackagingOptions(): Promise<Packaging[]> {
    const sorted = [...(db.packagingOptions || [])].sort((a,b) => a.name.localeCompare(b.name));
    return Promise.resolve(sorted);
}

export async function addPackagingOption(data: Omit<Packaging, 'id'>): Promise<Packaging> {
    if (!db.packagingOptions) db.packagingOptions = [];
    if (db.packagingOptions.some(o => o.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('Nama kemasan sudah ada.');
    }
    const newOption: Packaging = { ...data, id: `pkg_${Date.now()}` };
    db.packagingOptions.push(newOption);
    persistDb();
    return Promise.resolve(newOption);
}

export async function updatePackagingOption(id: string, data: Omit<Packaging, 'id'>): Promise<Packaging> {
    if (!db.packagingOptions) db.packagingOptions = [];
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
    if (!db.packagingOptions) db.packagingOptions = [];
    db.packagingOptions = db.packagingOptions.filter(o => o.id !== id);
    persistDb();
    return Promise.resolve();
}

// --- Purchase Functions ---
export async function getPurchases(): Promise<Purchase[]> {
    const sorted = [...(db.purchases || [])].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return Promise.resolve(sorted);
}

export async function addPurchase(data: Omit<Purchase, 'id' | 'createdAt' | 'status' | 'totalAmount'>): Promise<Purchase> {
    if (!db.purchases) db.purchases = [];
    const totalAmount = data.products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

    const newPurchase: Purchase = {
        ...data,
        id: `purch_${Date.now()}`,
        status: 'Selesai',
        totalAmount,
        createdAt: new Date().toISOString(),
    };

    // Update stock for each product and create stock movements
    newPurchase.products.forEach(p => {
        const productIndex = db.products.findIndex(prod => prod.id === p.productId);
        if (productIndex !== -1) {
            const product = db.products[productIndex];
            const stockBefore = product.stock;
            product.stock += p.quantity;
            const stockAfter = product.stock;

            const movement: StockMovement = {
                id: `sm_purch_${Date.now()}_${p.productId}`,
                productId: p.productId,
                referenceId: newPurchase.id,
                type: 'Pembelian',
                quantityChange: p.quantity,
                stockBefore: stockBefore,
                stockAfter: stockAfter,
                notes: `Pembelian dari ${newPurchase.supplierName} (No: ${newPurchase.purchaseNumber})`,
                createdAt: new Date().toISOString(),
            };
            db.stockMovements.push(movement);
        }
    });

    db.purchases.unshift(newPurchase);
    persistDb();
    return Promise.resolve(newPurchase);
}

// --- Direct Sale Function ---
export async function processDirectSale(
    user: User, 
    customerId: string,
    products: ShipmentProduct[]
): Promise<Shipment> {
    // 1. Check stock for all products first
    for (const product of products) {
        const masterProduct = db.products.find(p => p.id === product.productId);
        if (!masterProduct) {
            throw new Error(`Produk "${product.name}" tidak ditemukan.`);
        }
        if (masterProduct.stock < product.quantity) {
            throw new Error(`Stok tidak mencukupi untuk "${product.name}". Sisa: ${masterProduct.stock}, Dibutuhkan: ${product.quantity}.`);
        }
    }

    // 2. All stock is sufficient, proceed with transaction
    const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalAmount = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const customer = db.customers.find(c => c.id === customerId);
    if (!customer) {
        throw new Error('Pelanggan tidak ditemukan.');
    }

    const newShipment: Shipment = {
        id: `sale_${Date.now()}`,
        user: user.username,
        transactionId: `KASIR-${Date.now()}`,
        customerId: customerId,
        customerName: customer.name,
        expedition: 'Langsung', // Direct sale indicator
        packagingId: 'pkg_direct', // Direct sale indicator
        status: 'Terkirim', // Completed immediately
        products: products,
        totalItems: totalItems,
        totalProductCost: totalAmount,
        totalPackingCost: 0,
        totalAmount: totalAmount,
        createdAt: new Date().toISOString(),
    };

    // 3. Deduct stock and create stock movements
    products.forEach(p => {
        const productIndex = db.products.findIndex(prod => prod.id === p.productId);
        if (productIndex !== -1) {
            const product = db.products[productIndex];
            const stockBefore = product.stock;
            product.stock -= p.quantity;
            const stockAfter = product.stock;

            const movement: StockMovement = {
                id: `sm_sale_${Date.now()}_${p.productId}`,
                productId: p.productId,
                referenceId: newShipment.id,
                type: 'Penjualan',
                quantityChange: -p.quantity,
                stockBefore: stockBefore,
                stockAfter: stockAfter,
                notes: `Penjualan langsung (Kasir) - ${newShipment.transactionId}`,
                createdAt: new Date().toISOString(),
            };
            db.stockMovements.push(movement);
        }
    });

    // 4. Save shipment and persist DB
    db.shipments.unshift(newShipment);
    persistDb();
    
    return Promise.resolve(newShipment);
}

// --- Return Functions ---
export async function getReturns(): Promise<Return[]> {
    if (!db.returns) db.returns = [];
    const sorted = [...db.returns].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return Promise.resolve(sorted);
}


export async function addReturn(data: { originalShipmentId: string, products: ReturnedProduct[], reason: string }): Promise<Return> {
    if (!db.returns) db.returns = [];
    if (!db.stockMovements) db.stockMovements = [];

    const originalShipment = db.shipments.find(s => s.id === data.originalShipmentId);
    if (!originalShipment) {
        throw new Error('Transaksi penjualan asli tidak ditemukan.');
    }

    const totalAmount = data.products.reduce((sum, p) => sum + p.price * p.quantity, 0);

    const newReturn: Return = {
        id: `ret_${Date.now()}`,
        originalShipmentId: data.originalShipmentId,
        originalTransactionId: originalShipment.transactionId,
        customerName: originalShipment.customerName,
        products: data.products,
        reason: data.reason,
        totalAmount,
        createdAt: new Date().toISOString(),
    };

    // --- Stock and Stock Movement Logic ---
    data.products.forEach(p => {
        const productIndex = db.products.findIndex(prod => prod.id === p.productId);
        if (productIndex !== -1) {
            const product = db.products[productIndex];
            const stockBefore = product.stock;
            product.stock += p.quantity; // Increase stock due to return
            const stockAfter = product.stock;

            const movement: StockMovement = {
                id: `sm_ret_${Date.now()}_${p.productId}`,
                productId: p.productId,
                referenceId: newReturn.id,
                type: 'Retur',
                quantityChange: p.quantity,
                stockBefore: stockBefore,
                stockAfter: stockAfter,
                notes: `Retur dari transaksi ${originalShipment.transactionId}`,
                createdAt: new Date().toISOString(),
            };
            db.stockMovements.push(movement);
        } else {
            console.warn(`Product with ID ${p.productId} not found during return transaction.`);
        }
    });
    // --- End of Stock Logic ---


    db.returns.unshift(newReturn);
    persistDb();
    return Promise.resolve(newReturn);
}
