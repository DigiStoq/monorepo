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
  salePrice: number;
  purchasePrice: number;
  taxRate?: number;
  stockQuantity: number;
  lowStockAlert: number;
  isActive: boolean;
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
  salePrice: number;
  purchasePrice?: number | undefined;
  taxRate?: number | undefined;
  openingStock?: number | undefined;
  lowStockAlert?: number | undefined;
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

// Legacy types for backwards compatibility
export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  unit_price: number;
  cost_price: number;
  quantity_in_stock: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  category: string;
  unit_price: number;
  cost_price: number;
  quantity_in_stock: number;
  reorder_level: number;
  is_active: boolean;
}

export interface ProductFilters {
  search: string;
  category: string | null;
  showInactive: boolean;
  lowStockOnly: boolean;
}
