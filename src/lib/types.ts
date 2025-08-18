
export interface Product {
    id: string;
    code: string; // Kode Item
    name: string;
    price: number;
    stock: number;
    imageUrl: string;
}

export interface ShipmentProduct {
    productId: string; // Reference to the master product, now required
    name: string;
    quantity: number;
    price: number; // Can be overridden from master product's price
    discount: number; // in nominal value (e.g. Rp 1000)
    packingFee: number; 
    imageUrl: string | null;
}

export interface Shipment {
    id: string;
    user: string;
    transactionId: string;
    expedition: string;
    receipt?: { // Receipt is now optional
        fileName: string;
        dataUrl: string; // Base64 encoded PDF
    };
    products: ShipmentProduct[];
    totalItems: number;
    totalProductCost: number; // Total price of products after discount
    totalPackingCost: number; // Total of all packing fees
    totalAmount: number; // Grand total (totalProductCost + totalPackingCost)
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
    shipmentId: string; // Add the original shipment ID
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

export interface Expedition {
    id: string;
    name: string;
}

    