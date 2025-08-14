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
    createdAt: string; // ISO String for when it was added
}

export interface User {
    id: string;
    username: string;
    name: string;
    role: 'admin' | 'user';
}

export interface CheckoutItem {
    name: string;
    quantity: number;
}

// This interface represents a processed shipment record in the history.
export interface Checkout {
    id: string;
    transactionId: string;
    customerName: string; // Represents the sender/user from the shipment
    items: CheckoutItem[];
    totalItems: number;
    totalAmount: number; // May not be available from shipment data
    createdAt: string; // ISO String for when it was processed
}
