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
