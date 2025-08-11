import type { Product, Transaction, CheckoutItem, Shipment, ShipmentProduct } from '@/lib/types';

// Mock product data
let products: Product[] = [
  { id: '1', code: 'SKU001', name: 'Mouse Nirkabel', stock: 150 },
  { id: '2', code: 'SKU002', name: 'Keyboard Mekanikal', stock: 80 },
  { id: '3', code: 'SKU003', name: 'Monitor 4K 27-inci', stock: 50 },
  { id: '4', code: 'SKU004', name: 'Hub USB-C', stock: 200 },
  { id: '5', code: 'SKU005', name: 'Webcam 1080p', stock: 120 },
  { id: '6', code: 'SKU006', name: 'Stand Laptop', stock: 300 },
  { id: '7', code: 'SKU007', name: 'Headphone Peredam Bising', stock: 75 },
  { id: '8', code: 'SKU008', name: 'Kursi Ergonomis', stock: 25 },
];

// Mock transaction history data
let transactions: Transaction[] = [];

// Mock shipment data
let shipments: Shipment[] = [];


export async function getProducts(query?: string): Promise<Product[]> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
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
    return products.find((p) => p.code.toLowerCase() === code.toLowerCase());
}

export async function addOrUpdateProduct(productData: Omit<Product, 'id' | 'receiptNumber'> & { id?: string }): Promise<Product> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (productData.id) {
    // Update
    const index = products.findIndex(p => p.id === productData.id);
    if (index > -1) {
      if (products.some(p => p.code.toLowerCase() === productData.code.toLowerCase() && p.id !== productData.id)) {
        throw new Error('Kode produk harus unik.');
      }
      products[index] = { ...products[index], ...productData };
      return products[index];
    }
    throw new Error('Produk tidak ditemukan untuk diperbarui.');
  } else {
    // Add
    if (products.some(p => p.code.toLowerCase() === productData.code.toLowerCase())) {
        throw new Error('Kode produk harus unik.');
    }
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}`,
    };
    products.push(newProduct);
    return newProduct;
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = products.findIndex(p => p.id === productId);
  if (index > -1) {
    products.splice(index, 1);
  } else {
    throw new Error('Produk tidak ditemukan.');
  }
}

export async function getCheckoutHistory(): Promise<Transaction[]> {
  // Sort by most recent
  return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addCheckout(transaction: {customerName: string, items: CheckoutItem[]}): Promise<Transaction> {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  const newTransaction: Transaction = {
    ...transaction,
    id: `txn_${Date.now()}`,
    date: new Date().toISOString(),
    totalItems: transaction.items.reduce((sum, item) => sum + item.quantity, 0),
  };

  // Simulate stock update
  for (const item of newTransaction.items) {
    const product = products.find(p => p.id === item.id);
    if (product) {
      if (product.stock < item.quantity) {
        throw new Error(`Stok tidak cukup untuk ${product.name}. Hanya tersisa ${product.stock}.`);
      }
      product.stock -= item.quantity;
    } else {
        throw new Error(`Produk dengan id ${item.id} tidak ditemukan.`);
    }
  }

  transactions.unshift(newTransaction);
  return newTransaction;
}


// Shipment Functions
export async function getShipments(): Promise<Shipment[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return [...shipments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addShipment(data: Omit<Shipment, 'id' | 'createdAt' | 'totalItems'>): Promise<Shipment> {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (shipments.some(s => s.transactionId.toLowerCase() === data.transactionId.toLowerCase())) {
    throw new Error('ID Transaksi harus unik.');
  }
  const newShipment: Shipment = {
    ...data,
    id: `ship_${Date.now()}`,
    createdAt: new Date().toISOString(),
    totalItems: data.products.reduce((sum, p) => sum + p.quantity, 0),
  };
  shipments.unshift(newShipment);
  return newShipment;
}

export async function deleteShipment(shipmentId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = shipments.findIndex(s => s.id === shipmentId);
    if (index > -1) {
        shipments.splice(index, 1);
    } else {
        throw new Error('Pengiriman tidak ditemukan.');
    }
}
