export interface Product {
  id: string;
  code: string;
  name: string;
  stock: number;
  price: number;
}

export interface ShipmentProduct {
    name: string;
    quantity: number;
}

export interface Shipment {
    id: string;
    user: string;
    transactionId: string;
    expedition: string;
    receipt: {
        fileName: string;
        dataUrl: string; // Base64 encoded PDF
    };
    products: ShipmentProduct[];
    totalItems: number;
    createdAt: string; // ISO String
}

export interface User {
    id: string;
    username: string;
    name: string;
    role: 'admin' | 'user';
}

export interface CheckoutItem {
    code: string;
    name: string;
    quantity: number;
    stock: number;
    price: number;
}

export interface Checkout {
    id: string;
    transactionId: string;
    customerName: string;
    items: CheckoutItem[];
    totalItems: number;
    totalAmount: number;
    createdAt: string; // ISO String
}
