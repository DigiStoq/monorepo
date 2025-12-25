import { PowerSyncDatabase, column, Schema, Table } from "@powersync/web";
import { SupabaseConnector } from "./supabase-connector";

// Define the products table schema
const products = new Table({
  id: column.text,
  name: column.text,
  sku: column.text,
  description: column.text,
  category: column.text,
  unit_price: column.real,
  cost_price: column.real,
  quantity_in_stock: column.integer,
  reorder_level: column.integer,
  is_active: column.integer, // SQLite uses integer for boolean
  created_at: column.text,
  updated_at: column.text,
});

// Define the sales table schema
const sales = new Table({
  id: column.text,
  product_id: column.text,
  quantity: column.integer,
  unit_price: column.real,
  total_amount: column.real,
  customer_name: column.text,
  payment_method: column.text,
  sale_date: column.text,
  created_at: column.text,
  updated_at: column.text,
});

// Define the schema with all tables
export const AppSchema = new Schema({
  products,
  sales,
});

// Type for the database instance
export type Database = (typeof AppSchema)["types"];
export type ProductRecord = Database["products"];
export type SaleRecord = Database["sales"];

// Singleton database instance
let powerSyncInstance: PowerSyncDatabase | null = null;

export function getPowerSyncDatabase(): PowerSyncDatabase {
  if (powerSyncInstance) {
    return powerSyncInstance;
  }

  powerSyncInstance = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
      dbFilename: "digistoq.sqlite",
    },
  });

  return powerSyncInstance;
}

export async function initializePowerSync(): Promise<PowerSyncDatabase> {
  const db = getPowerSyncDatabase();

  // Initialize connector for sync with Supabase
  const connector = new SupabaseConnector();

  // Connect to PowerSync service
  await db.connect(connector);

  return db;
}

export async function disconnectPowerSync(): Promise<void> {
  if (powerSyncInstance) {
    await powerSyncInstance.disconnect();
    powerSyncInstance = null;
  }
}

// Export the singleton getter
export { powerSyncInstance };
