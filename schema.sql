-- Create custom ENUM types first, as they are dependencies for the tables.
CREATE TYPE "user_role" AS ENUM ('admin', 'user');
CREATE TYPE "shipment_status" AS ENUM ('Proses', 'Pengemasan', 'Terkirim');
CREATE TYPE "purchase_status" AS ENUM ('Selesai', 'Draf');
CREATE TYPE "stock_movement_type" AS ENUM ('Stok Awal', 'Penjualan', 'Stok Opname', 'Pembelian', 'Retur');
CREATE TYPE "transaction_type" AS ENUM ('in', 'out');

-- Create the tables. The order is important to satisfy foreign key constraints.

-- Tables without foreign keys can be created first.
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "username" VARCHAR(255) NOT NULL UNIQUE,
  "role" user_role NOT NULL,
  "password" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "products" (
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

CREATE TABLE IF NOT EXISTS "expeditions" (
  "id" TEXT PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS "packaging_options" (
  "id" TEXT PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "cost" REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS "customers" (
  "id" TEXT PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "address" TEXT,
  "phone" VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" TEXT PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "address" TEXT,
  "phone" VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS "financial_transactions" (
  "id" TEXT PRIMARY KEY,
  "type" transaction_type NOT NULL,
  "amount" REAL NOT NULL,
  "category" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "transaction_date" DATE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tables with foreign keys.
CREATE TABLE IF NOT EXISTS "shipments" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id"),
  "transaction_id" VARCHAR(255) NOT NULL,
  "customer_id" TEXT NOT NULL REFERENCES "customers"("id"),
  "customer_name" VARCHAR(255) NOT NULL,
  "expedition" VARCHAR(255) NOT NULL,
  "packaging_id" TEXT,
  "status" shipment_status NOT NULL,
  "receipt" JSONB,
  "products" JSONB NOT NULL,
  "total_items" INTEGER NOT NULL,
  "total_product_cost" REAL NOT NULL,
  "total_packing_cost" REAL NOT NULL,
  "total_amount" REAL NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "purchases" (
  "id" TEXT PRIMARY KEY,
  "supplier_id" TEXT NOT NULL REFERENCES "suppliers"("id"),
  "supplier_name" VARCHAR(255) NOT NULL,
  "purchase_number" VARCHAR(255) NOT NULL,
  "status" purchase_status NOT NULL,
  "products" JSONB NOT NULL,
  "total_amount" REAL NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "returns" (
  "id" TEXT PRIMARY KEY,
  "original_shipment_id" TEXT NOT NULL,
  "original_transaction_id" VARCHAR(255) NOT NULL,
  "customer_name" VARCHAR(255) NOT NULL,
  "products" JSONB NOT NULL,
  "reason" TEXT NOT NULL,
  "total_amount" REAL NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id" TEXT PRIMARY KEY,
  "product_id" TEXT NOT NULL REFERENCES "products"("id"),
  "reference_id" TEXT,
  "type" stock_movement_type NOT NULL,
  "quantity_change" INTEGER NOT NULL,
  "stock_before" INTEGER NOT NULL,
  "stock_after" INTEGER NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);