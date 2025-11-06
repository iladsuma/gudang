-- Drop existing types and tables to ensure a clean slate (optional, use with caution)
DROP TABLE IF EXISTS "financial_transactions", "stock_movements", "returns", "purchases", "shipments", "suppliers", "customers", "packaging_options", "expeditions", "products", "accounts", "users";
DROP TYPE IF EXISTS "user_role", "shipment_status", "purchase_status", "stock_movement_type", "transaction_type", "account_type", "payment_status";

-- Create ENUM types
CREATE TYPE "user_role" AS ENUM ('admin', 'user');
CREATE TYPE "shipment_status" AS ENUM ('Proses', 'Pengemasan', 'Terkirim');
CREATE TYPE "purchase_status" AS ENUM ('Selesai', 'Draf');
CREATE TYPE "stock_movement_type" AS ENUM ('Stok Awal', 'Penjualan', 'Stok Opname', 'Pembelian', 'Retur');
CREATE TYPE "transaction_type" AS ENUM ('in', 'out');
CREATE TYPE "account_type" AS ENUM ('Cash', 'Bank', 'E-Wallet', 'Other');
CREATE TYPE "payment_status" AS ENUM ('Lunas', 'Belum Lunas');

-- Create Tables

-- Table: users
CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY,
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "role" "user_role" NOT NULL,
    "password" TEXT NOT NULL
);

-- Table: accounts
CREATE TABLE "accounts" (
    "id" TEXT PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "type" "account_type" NOT NULL DEFAULT 'Bank',
    "balance" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: products
CREATE TABLE "products" (
    "id" TEXT PRIMARY KEY,
    "code" VARCHAR(255) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "price" REAL NOT NULL,
    "cost_price" REAL NOT NULL,
    "stock" INTEGER NOT NULL,
    "min_stock" INTEGER NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "image_url" TEXT
);

-- Table: expeditions
CREATE TABLE "expeditions" (
    "id" TEXT PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL
);

-- Table: packaging_options
CREATE TABLE "packaging_options" (
    "id" TEXT PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "cost" REAL NOT NULL
);

-- Table: customers
CREATE TABLE "customers" (
    "id" TEXT PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(50)
);

-- Table: suppliers
CREATE TABLE "suppliers" (
    "id" TEXT PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(50)
);

-- Table: shipments
CREATE TABLE "shipments" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "transaction_id" VARCHAR(255) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "expedition" VARCHAR(255) NOT NULL,
    "packaging_id" TEXT,
    "account_id" TEXT,
    "status" "shipment_status" NOT NULL,
    "payment_status" "payment_status" NOT NULL DEFAULT 'Lunas',
    "receipt" JSONB,
    "products" JSONB NOT NULL,
    "total_items" INTEGER NOT NULL,
    "total_product_cost" REAL NOT NULL,
    "total_packing_cost" REAL NOT NULL,
    "total_amount" REAL NOT NULL,
    "total_revenue" REAL NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "paid_at" TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id"),
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
);

-- Table: purchases
CREATE TABLE "purchases" (
    "id" TEXT PRIMARY KEY,
    "supplier_id" TEXT NOT NULL,
    "supplier_name" VARCHAR(255) NOT NULL,
    "purchase_number" VARCHAR(255) NOT NULL,
    "account_id" TEXT,
    "status" "purchase_status" NOT NULL,
    "payment_status" "payment_status" NOT NULL DEFAULT 'Lunas',
    "products" JSONB NOT NULL,
    "total_amount" REAL NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "paid_at" TIMESTAMP,
    FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id")
);

-- Table: returns
CREATE TABLE "returns" (
    "id" TEXT PRIMARY KEY,
    "original_shipment_id" TEXT NOT NULL,
    "original_transaction_id" VARCHAR(255) NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "products" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "total_amount" REAL NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: stock_movements
CREATE TABLE "stock_movements" (
    "id" TEXT PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "reference_id" TEXT,
    "type" "stock_movement_type" NOT NULL,
    "quantity_change" INTEGER NOT NULL,
    "stock_before" INTEGER NOT NULL,
    "stock_after" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("product_id") REFERENCES "products"("id")
);

-- Table: financial_transactions
CREATE TABLE "financial_transactions" (
    "id" TEXT PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "type" "transaction_type" NOT NULL,
    "amount" REAL NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "transaction_date" DATE NOT NULL,
    "reference_id" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
);
