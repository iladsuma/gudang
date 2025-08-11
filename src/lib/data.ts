import type { Product, Transaction, CheckoutItem } from '@/lib/types';

// Mock product data
let products: Product[] = [
  { id: '1', code: 'SKU001', name: 'Wireless Mouse', stock: 150 },
  { id: '2', code: 'SKU002', name: 'Mechanical Keyboard', stock: 80 },
  { id: '3', code: 'SKU003', name: '27-inch 4K Monitor', stock: 50 },
  { id: '4', code: 'SKU004', name: 'USB-C Hub', stock: 200 },
  { id: '5', code: 'SKU005', name: 'Webcam 1080p', stock: 120 },
  { id: '6', code: 'SKU006', name: 'Laptop Stand', stock: 300 },
  { id: '7', code: 'SKU007', name: 'Noise Cancelling Headphones', stock: 75 },
  { id: '8', code: 'SKU008', name: 'Ergonomic Chair', stock: 25 },
];

// Mock transaction history data
let transactions: Transaction[] = [];

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

export async function addOrUpdateProduct(productData: Omit<Product, 'id'> & { id?: string }): Promise<Product> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (productData.id) {
    // Update
    const index = products.findIndex(p => p.id === productData.id);
    if (index > -1) {
      if (products.some(p => p.code.toLowerCase() === productData.code.toLowerCase() && p.id !== productData.id)) {
        throw new Error('Product code must be unique.');
      }
      products[index] = { ...products[index], ...productData };
      return products[index];
    }
    throw new Error('Product not found for update.');
  } else {
    // Add
    if (products.some(p => p.code.toLowerCase() === productData.code.toLowerCase())) {
        throw new Error('Product code must be unique.');
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
    throw new Error('Product not found.');
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
        throw new Error(`Not enough stock for ${product.name}. Only ${product.stock} left.`);
      }
      product.stock -= item.quantity;
    } else {
        throw new Error(`Product with id ${item.id} not found.`);
    }
  }

  transactions.unshift(newTransaction);
  return newTransaction;
}
