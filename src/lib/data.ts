import type { Product, Transaction, CheckoutItem } from '@/lib/types';

// Mock product data
const products: Product[] = [
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
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  if (!query) {
    return products;
  }
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.code.toLowerCase().includes(query.toLowerCase())
  );
}

export async function getProductByCode(code: string): Promise<Product | undefined> {
    return products.find((p) => p.code.toLowerCase() === code.toLowerCase());
}

export async function getCheckoutHistory(): Promise<Transaction[]> {
  // Sort by most recent
  return [...transactions].sort((a, b) => new Date(b.date).getTime() - new 'date'(b.date).getTime());
}

export async function addCheckout(transaction: {customerName: string, items: CheckoutItem[]}): Promise<Transaction> {
  const newTransaction: Transaction = {
    ...transaction,
    id: `txn_${Date.now()}`,
    date: new Date().toISOString(),
    totalItems: transaction.items.reduce((sum, item) => sum + item.quantity, 0),
  };

  // Simulate stock update
  newTransaction.items.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (product) {
      product.stock -= item.quantity;
    }
  });

  transactions.unshift(newTransaction);
  return newTransaction;
}
