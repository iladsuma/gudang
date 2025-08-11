export interface Product {
  id: string;
  code: string;
  name: string;
  stock: number;
}

export interface CheckoutItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  customerName: string;
  items: CheckoutItem[];
  totalItems: number;
  date: string; // ISO string
}
