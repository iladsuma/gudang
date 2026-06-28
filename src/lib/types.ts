
export interface Product {
    id: string;
    code: string; // Kode Item
    name: string; // Will store category name now as primary identifier
    price: number; // Harga Jual
    costPrice: number; // Harga Pokok (HPP)
    stock: number;
    minStock: number; // Stok Minimal
    unit: string; // Satuan (PCS, DUS, dll)
    category: string; // Master category
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
    category: string;
    quantity: number;
    price: number; 
    costPrice: number; // Cost price (HPP)
    imageUrl: string | null;
    notes?: string; // Deskripsi spesifik per item baju
}

export interface BodyMeasurements {
    ld?: string; // Lingkar Dada
    panjangPunggung?: string;
    lBahu?: string; // Lebar Bahu
    pLengan?: string; // Panjang Lengan
    lingkarTelapakTangan?: string;
    lp?: string; // Lingkar Pinggang
    lingkarHip?: string; // Lingkar Hip/Pinggul
    tinggiHip?: string; // Tinggi Hip/Pinggul
    tinggiDuduk?: string;
    pBawah?: string; // Panjang Rok/Cln
    lBawah?: string; // Lebar Rok/Celana
    notes?: string;
}

export type DeliveryMethod = 'Diambil di Toko' | 'Dikirim Kurir Toko';

export interface Shipment {
    id: string;
    userId: string;
    transactionId: string;
    customerId: string;
    customerName: string;
    accountId: string; // Akun yang menerima pembayaran
    status: 'Proses' | 'Pengemasan' | 'Terkirim';
    paymentStatus: PaymentStatus;
    deliveryMethod: DeliveryMethod;
    receipt?: { 
        fileName: string;
        dataUrl: string; // Base64 encoded PDF
    };
    products: ShipmentProduct[];
    totalItems: number;
    totalProductCost: number; // Total price of products
    totalAmount: number; // Grand total
    totalRevenue: number; // Explicitly store revenue
    createdAt: string; // ISO String for when it was added
    paidAt?: string;
    downPayment?: number;
    bodyMeasurements?: BodyMeasurements;
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
        userId: string;
        userName: string;
        totalRevenue: number;
        totalCOGS: number;
        profit: number;
    }[];
}

export interface Notification {
    id: string;
    recipientId: string; // 'admin' or a specific user ID
    message: string;
    url?: string;
    isRead: boolean;
    createdAt: number; // timestamp
}
