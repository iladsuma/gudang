
export interface Product {
    id: string;
    code: string; 
    name: string; 
    price: number; 
    costPrice: number; 
    stock: number;
    minStock: number; 
    unit: string; 
    category: string; 
    imageUrls: string[]; 
}

export interface StockMovement {
    id: string;
    productId: string;
    referenceId?: string; 
    type: 'Stok Awal' | 'Penjualan' | 'Stok Opname' | 'Pembelian' | 'Retur';
    quantityChange: number; 
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
    costPrice: number; 
    imageUrl: string | null;
}

export type PaymentStatus = 'Lunas' | 'Belum Lunas';

export interface Purchase {
    id: string;
    supplierId: string;
    supplierName: string;
    purchaseNumber: string; 
    accountId: string | null; 
    status: 'Selesai' | 'Draf';
    paymentStatus: PaymentStatus;
    products: PurchaseProduct[];
    totalAmount: number;
    createdAt: string; 
    paidAt?: string;
}


export interface ShipmentProduct {
    productId: string; 
    code: string;
    name: string;
    category: string;
    quantity: number;
    price: number; 
    costPrice: number; 
    imageUrl: string | null;
    imageUrls?: string[]; 
    notes?: string; 
}

export interface BodyMeasurements {
    ld?: string; 
    panjangPunggung?: string;
    lBahu?: string; 
    pLengan?: string; 
    lingkarTelapakTangan?: string;
    lp?: string; 
    lingkarHip?: string; 
    tinggiHip?: string; 
    tinggiDuduk?: string;
    pBawah?: string; 
    lBawah?: string;
    notes?: string;
}

export type DeliveryMethod = 'Diambil di Toko' | 'Dikirim Kurir Toko';

export interface Shipment {
    id: string;
    userId: string | null; // Changed to nullable
    transactionId: string;
    customerId: string;
    customerName: string;
    accountId: string; 
    status: 'Proses' | 'Pengemasan' | 'Terkirim';
    paymentStatus: PaymentStatus;
    deliveryMethod: DeliveryMethod;
    receipt?: { 
        fileName: string;
        dataUrl: string; 
    };
    products: ShipmentProduct[];
    totalItems: number;
    totalProductCost: number; 
    totalAmount: number; 
    totalRevenue: number; 
    createdAt: string; 
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
    phone?: string;
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
    shipmentId: string; 
    transactionId: string;
    totalAmount: number;
    totalItems: number;
}


export interface Checkout {
    id: string; 
    processorName: string; 
    processedShipments: ProcessedShipmentSummary[]; 
    totalBatchItems: number; 
    totalBatchAmount: number; 
    createdAt: string; 
}

export interface CartItem extends Product {
    quantity: number;
}

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
  account: { 
      name: string;
  };
  type: 'in' | 'out';
  amount: number;
  category: string;
  description: string;
  transactionDate: string; 
  referenceId?: string; 
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
    recipientId: string; 
    message: string;
    url?: string;
    isRead: boolean;
    createdAt: number; 
}
