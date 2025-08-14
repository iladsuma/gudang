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

// This interface is now used for the history log, which is created from processed shipments.
export interface CheckoutItem {
    code: string; // Product Code (or name, if code is not available)
    name: string;
    quantity: number;
    price: number; // May not be available from shipment data
    stock: number; // May not be available from shipment data
}

// This interface represents a processed shipment record in the history.
export interface Checkout {
    id: string;
    transactionId: string;
    customerName: string; // Represents the sender/user from the shipment
    items: CheckoutItem[];
    totalItems: number;
    totalAmount: number; // May not be available from shipment data
    createdAt: string; // ISO String from the original shipment
}