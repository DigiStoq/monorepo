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
