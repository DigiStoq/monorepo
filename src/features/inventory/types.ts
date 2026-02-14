// ============================================================================
// ITEM TYPES
// ============================================================================

export type ItemType = "product" | "service";

export interface Item {
  id: string;
  name: string;
  sku: string;
  type: ItemType;
  description?: string;
  category?: string;
  unit: string;
  mrp?: number;
  salePrice: number;
  purchasePrice: number;
  taxRate?: number;
  stockQuantity: number;
  lowStockAlert: number;
  isActive: boolean;
  // Optional additional fields
  batchNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  barcode?: string;
  hsnCode?: string;
  warrantyDays?: number;
  brand?: string;
  modelNumber?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemFormData {
  name: string;
  sku?: string | undefined;
  type: ItemType;
  description?: string | undefined;
  category?: string | undefined;
  unit: string;
  mrp?: number | undefined;
  salePrice: number;
  purchasePrice?: number | undefined;
  taxRate?: number | undefined;
  openingStock?: number | undefined;
  lowStockAlert?: number | undefined;
  // Optional additional fields
  batchNumber?: string | undefined;
  expiryDate?: string | undefined;
  manufactureDate?: string | undefined;
  barcode?: string | undefined;
  hsnCode?: string | undefined;
  warrantyDays?: number | undefined;
  brand?: string | undefined;
  modelNumber?: string | undefined;
  location?: string | undefined;
}

export interface ItemFilters {
  search: string;
  type: ItemType | "all";
  category: string;
  stockStatus: "all" | "in-stock" | "low-stock" | "out-of-stock";
  sortBy: "name" | "price" | "stock" | "recent";
  sortOrder: "asc" | "desc";
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
}
