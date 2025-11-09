

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

export interface StockMovement {
    id: string;
    productId: string;
    referenceId?: string; // e.g., shipmentId or purchaseId or returnId
    type: 'Stok Awal' | 'Penjualan' | 'Stok Opname' | 'Pembelian' | 'Retur';
    quantityChange: number; // e.g., -5 for sale, +50 for purchase
    stockBefore: number;
    stockAfter: number;
    notes?: string;
    createdAt: string;
}

export interface PurchaseProduct {
    productId: string;
    code: string;
    name: string;
    quantity: number;
    costPrice: number; // Harga beli saat transaksi ini
    imageUrl: string | null;
}

export type PaymentStatus = 'Lunas' | 'Belum Lunas';

export interface Purchase {
    id: string;
    supplierId: string;
    supplierName: string;
    purchaseNumber: string; // Nomor faktur pembelian
    accountId: string | null; // Akun yang digunakan untuk membayar, bisa null jika belum lunas
    status: 'Selesai' | 'Draf';
    paymentStatus: PaymentStatus;
    products: PurchaseProduct[];
    totalAmount: number;
    createdAt: string; // ISO String for when it was added
    paidAt?: string;
}


export interface ShipmentProduct {
    productId: string; // Reference to the master product
    code: string;
    name: string;
    quantity: number;
    price: number; // Can be overridden from master product's price
    costPrice: number; // Cost price at the time of sale
    imageUrl: string | null;
}

export interface Shipment {
    id: string;
    userId: string;
    transactionId: string;
    customerId: string;
    customerName: string;
    expedition: string;
    packagingId: string; // The selected packaging for the whole shipment
    accountId: string; // Akun yang menerima pembayaran
    status: 'Proses' | 'Pengemasan' | 'Terkirim';
    paymentStatus: PaymentStatus;
    receipt?: { // Receipt is now optional
        fileName: string;
        dataUrl: string; // Base64 encoded PDF
    };
    products: ShipmentProduct[];
    totalItems: number;
    totalProductCost: number; // Total price of products
    totalPackingCost: number; // Total of all packing fees
    totalAmount: number; // Grand total (totalProductCost + totalPackingCost)
    totalRevenue: number; // Explicitly store revenue
    createdAt: string; // ISO String for when it was added
    paidAt?: string;
}

export interface ReturnedProduct {
    productId: string;
    name: string;
    quantity: number;
    price: number;
}

export interface Return {
    id: string;
    originalShipmentId: string;
    originalTransactionId: string;
    customerName: string;
    products: ReturnedProduct[];
    reason: string;
    totalAmount: number;
    createdAt: string;
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

export interface Supplier {
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

export type SortableProductField = 'code' | 'name' | 'category' | 'stock';
export type SortOrder = 'asc' | 'desc';

export interface Account {
    id: string;
    name: string;
    type: 'Cash' | 'Bank' | 'E-Wallet' | 'Other';
    balance: number;
    notes?: string;
    createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  accountId: string;
  account: { // For relation query
      name: string;
  };
  type: 'in' | 'out';
  amount: number;
  category: string;
  description: string;
  transactionDate: string; // Should be a string in 'YYYY-MM-DD' format
  referenceId?: string; // Optional reference to a sale, purchase, etc.
  createdAt: string;
}

export interface Transfer {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    transferDate: Date;
    description: string;
}

export interface SalesProfitReportData {
    totalRevenue: number;
    totalCOGS: number;
    grossProfit: number;
    operationalExpenses: number;
    netProfit: number;
    transactionDetails: {
        id: string;
        transactionId: string;
        createdAt: string;
        customerName: string;
        totalRevenue: number;
        totalCOGS: number;
        profit: number;
    }[];
}
