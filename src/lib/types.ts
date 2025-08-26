

export interface Product {
    id: string;
    code: string; // Kode Item
    name: string;
    price: number; // Harga Jual
    costPrice: number; // Harga Pokok
    stock: number;
    minStock: number; // Stok Minimal
    unit: string; // Satuan (PCS, DUS, dll)
    category: string; // Kategori Barang
    imageUrl: string;
}

export interface ShipmentProduct {
    productId: string; // Reference to the master product
    code: string;
    name: string;
    quantity: number;
    price: number; // Can be overridden from master product's price
    imageUrl: string | null;
}

export interface Shipment {
    id: string;
    user: string;
    transactionId: string;
    expedition: string;
    packagingId: string; // The selected packaging for the whole shipment
    status: 'Proses' | 'Pengemasan' | 'Terkirim';
    receipt?: { // Receipt is now optional
        fileName: string;
        dataUrl: string; // Base64 encoded PDF
    };
    products: ShipmentProduct[];
    totalItems: number;
    totalProductCost: number; // Total price of products
    totalPackingCost: number; // Total of all packing fees
    totalAmount: number; // Grand total (totalProductCost + totalPackingCost)
    createdAt: string; // ISO String for when it was added
}

export interface User {
    id: string;
    username: string;
    role: 'admin' | 'user';
    password?: string;
}

export interface Customer {
    id: string;
    name: string;
    address: string;
    phone: string;
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
    name:string;
}

export interface Packaging {
    id: string;
    name: string;
    cost: number;
}

export interface CartItem extends Product {
    quantity: number;
}

// Interface for what is selected on the products page
export interface ProductSelection {
    [productId: string]: boolean;
}
