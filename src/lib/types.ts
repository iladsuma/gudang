export interface ShipmentProduct {
    name: string;
    quantity: number;
    price: number;
    discount: number; // in percentage (0-100)
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
    totalAmount: number; // Grand total after discounts
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
    price: number;
    discount: number;
    subtotal: number;
}


export interface ProcessedShipmentSummary {
    transactionId: string;
    totalAmount: number;
    totalItems: number;
}


// This interface represents a processed shipment record in the history.
// It can now represent a batch of processed shipments.
export interface Checkout {
    id: string; // Unique ID for the batch process
    processorName: string; // User who processed the batch
    processedShipments: ProcessedShipmentSummary[]; // Summary of all shipments in this batch
    totalBatchItems: number; // Sum of all items from all shipments in the batch
    totalBatchAmount: number; // Sum of all amounts from all shipments in the batch
    createdAt: string; // ISO String for when it was processed
}