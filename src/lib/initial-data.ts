
import type { User, Product, Expedition, Packaging, Shipment, Checkout, Customer } from './types';

interface DbData {
  users: User[];
  products: Product[];
  expeditions: Expedition[];
  packagingOptions: Packaging[];
  shipments: Shipment[];
  checkoutHistory: Checkout[];
  customers: Customer[];
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
      price: 50000,
      stock: 100,
      imageUrl: "https://placehold.co/100x100.png"
    },
    {
      id: "prod_2",
      code: "CP-001",
      name: "Celana Panjang",
      price: 120000,
      stock: 50,
      imageUrl: "https://placehold.co/100x100.png"
    },
    {
      id: "prod_3",
      code: "TP-001",
      name: "Topi",
      price: 35000,
      stock: 75,
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
  ]
};
