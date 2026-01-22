import { useQuery } from "@powersync/react";
import { useMemo } from "react";
import type { Product } from "../types";

// Type for database record
interface ProductRecord {
  id: string;
  name: string | null;
  sku: string | null;
  description: string | null;
  category: string | null;
  unit_price: number | null;
  cost_price: number | null;
  quantity_in_stock: number | null;
  reorder_level: number | null;
  is_active: number | null;
  created_at: string | null;
  updated_at: string | null;
}

// Convert database record to Product type
function mapRecordToProduct(record: ProductRecord): Product {
  return {
    id: record.id,
    name: record.name ?? "",
    sku: record.sku ?? "",
    description: record.description ?? "",
    category: record.category ?? "",
    unit_price: record.unit_price ?? 0,
    cost_price: record.cost_price ?? 0,
    quantity_in_stock: record.quantity_in_stock ?? 0,
    reorder_level: record.reorder_level ?? 0,
    is_active: record.is_active === 1,
    created_at: record.created_at ?? "",
    updated_at: record.updated_at ?? "",
  };
}

interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  error: Error | undefined;
}

export function useProducts(): UseProductsResult {
  const { data, isLoading, error } = useQuery<ProductRecord>(
    "SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC"
  );

  const products = useMemo(() => data.map(mapRecordToProduct), [data]);

  return { products, isLoading, error };
}

export function useProductSearch(searchTerm: string): UseProductsResult {
  const params = useMemo(() => {
    const search = searchTerm ? `%${searchTerm}%` : null;
    return [search, search, search];
  }, [searchTerm]);

  const { data, isLoading, error } = useQuery<ProductRecord>(
    `SELECT * FROM products
     WHERE is_active = 1
     AND ($1 IS NULL OR name LIKE $1 OR sku LIKE $2 OR category LIKE $3)
     ORDER BY name ASC`,
    params
  );

  const products = useMemo(() => data.map(mapRecordToProduct), [data]);

  return { products, isLoading, error };
}

export function useLowStockProducts(): UseProductsResult {
  const { data, isLoading, error } = useQuery<ProductRecord>(
    `SELECT * FROM products
     WHERE is_active = 1
     AND quantity_in_stock <= reorder_level
     ORDER BY quantity_in_stock ASC`
  );

  const products = useMemo(() => data.map(mapRecordToProduct), [data]);

  return { products, isLoading, error };
}
