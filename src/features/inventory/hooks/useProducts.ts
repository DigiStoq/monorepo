import { usePowerSync } from "@powersync/react";
import { useEffect, useState } from "react";
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
  error: Error | null;
}

export function useProducts(): UseProductsResult {
  const powerSync = usePowerSync();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProducts(): Promise<void> {
      try {
        setIsLoading(true);
        const result = await powerSync.getAll<ProductRecord>(
          "SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC"
        );
        if (mounted) {
          setProducts(result.map(mapRecordToProduct));
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err : new Error("Failed to fetch products")
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchProducts();

    return () => {
      mounted = false;
    };
  }, [powerSync]);

  return { products, isLoading, error };
}

export function useProductSearch(searchTerm: string): UseProductsResult {
  const powerSync = usePowerSync();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProducts(): Promise<void> {
      try {
        setIsLoading(true);
        const result = await powerSync.getAll<ProductRecord>(
          `SELECT * FROM products
           WHERE is_active = 1
           AND (name LIKE ? OR sku LIKE ? OR category LIKE ?)
           ORDER BY name ASC`,
          [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        );
        if (mounted) {
          setProducts(result.map(mapRecordToProduct));
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err : new Error("Failed to search products")
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchProducts();

    return () => {
      mounted = false;
    };
  }, [powerSync, searchTerm]);

  return { products, isLoading, error };
}

export function useLowStockProducts(): UseProductsResult {
  const powerSync = usePowerSync();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProducts(): Promise<void> {
      try {
        setIsLoading(true);
        const result = await powerSync.getAll<ProductRecord>(
          `SELECT * FROM products
           WHERE is_active = 1
           AND quantity_in_stock <= reorder_level
           ORDER BY quantity_in_stock ASC`
        );
        if (mounted) {
          setProducts(result.map(mapRecordToProduct));
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to fetch low stock products")
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchProducts();

    return () => {
      mounted = false;
    };
  }, [powerSync]);

  return { products, isLoading, error };
}
