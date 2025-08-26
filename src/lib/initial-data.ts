

import type { User, Product, Expedition, Packaging, Shipment, Checkout, Customer, StockMovement, Supplier } from './types';

interface DbData {
  users: User[];
  products: Product[];
  expeditions: Expedition[];
  packagingOptions: Packaging[];
  shipments: Shipment[];
  checkoutHistory: Checkout[];
  customers: Customer[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
}

export const initialData: DbData = {
  users: [
    {
      id: "usr_1",
      username: "admin",
      role: "admin",
      password: "admin"
    },
    {
      id: "usr_2",
      username: "user",
      role: "user",
      password: "user"
    }
  ],
  products: [
    {
      id: "prod_1",
      code: "BA-001",
      name: "Baju Anak",
      price: 75000,
      costPrice: 50000,
      stock: 100,
      minStock: 10,
      unit: "PCS",
      category: "Pakaian",
      imageUrl: "https://placehold.co/100x100.png"
    },
    {
      id: "prod_2",
      code: "CP-001",
      name: "Celana Panjang",
      price: 150000,
      costPrice: 120000,
      stock: 50,
      minStock: 5,
      unit: "PCS",
      category: "Pakaian",
      imageUrl: "https://placehold.co/100x100.png"
    },
    {
      id: "prod_3",
      code: "TP-001",
      name: "Topi",
      price: 50000,
      costPrice: 35000,
      stock: 75,
      minStock: 15,
      unit: "PCS",
      category: "Aksesoris",
      imageUrl: "https://placehold.co/100x100.png"
    }
  ],
  expeditions: [
    {
      id: "exp_1",
      name: "JNE"
    },
    {
      id: "exp_2",
      name: "POS"
    },
    {
      id: "exp_3",
      name: "J&T"
    },
    {
      id: "exp_4",
      name: "ANTERAJA"
    },
    {
      id: "exp_5",
      name: "SICEPAT"
    }
  ],
  packagingOptions: [
    {
      id: "pkg_1",
      name: "Plastik",
      cost: 500
    },
    {
      id: "pkg_2",
      name: "Kardus Kecil",
      cost: 1500
    },
    {
      id: "pkg_3",
      name: "Kardus + Bubble Wrap",
      cost: 3000
    }
  ],
  shipments: [],
  checkoutHistory: [],
  customers: [
      {
          id: "cust_1",
          name: "Pelanggan Umum",
          address: "N/A",
          phone: "N/A"
      },
       {
          id: "cust_2",
          name: "Budi Santoso",
          address: "Jl. Merdeka No. 10, Jakarta",
          phone: "081234567890"
      }
  ],
  suppliers: [
     {
      "id": "sup_1",
      "name": "Supplier A",
      "address": "Jl. Industri No. 1, Bandung",
      "phone": "022-123456"
    },
    {
      "id": "sup_2",
      "name": "CV. Maju Jaya",
      "address": "Jl. Raya Bogor Km. 20, Jakarta",
      "phone": "021-987654"
    }
  ],
  stockMovements: [],
};
