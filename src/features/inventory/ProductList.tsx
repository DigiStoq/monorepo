import type { ReactNode, CSSProperties, ChangeEvent } from "react";
import { useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, Package, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useProductSearch } from "./hooks/useProducts";
import type { Product } from "./types";

const ROW_HEIGHT = 64;

interface ProductRowProps {
  product: Product;
  style: CSSProperties;
}

function ProductRow({ product, style }: ProductRowProps): ReactNode {
  const isLowStock = product.quantity_in_stock <= product.reorder_level;

  return (
    <div
      style={style}
      className={cn(
        "flex items-center gap-4 px-4 border-b border-gray-200",
        "hover:bg-gray-50 transition-colors duration-150"
      )}
    >
      {/* Product Icon */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
          <Package className="w-5 h-5 text-primary-600" />
        </div>
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
          {isLowStock && (
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">
          SKU: {product.sku} • {product.category}
        </p>
      </div>

      {/* Stock Info */}
      <div className="flex-shrink-0 text-right">
        <p
          className={cn(
            "font-medium",
            isLowStock ? "text-amber-600" : "text-gray-900"
          )}
        >
          {product.quantity_in_stock} in stock
        </p>
        <p className="text-sm text-gray-500">
          ${product.unit_price.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

export function ProductList(): ReactNode {
  const [searchTerm, setSearchTerm] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const { products, isLoading, error } = useProductSearch(searchTerm);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <p>Error loading products: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with Search */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Products</h2>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={cn(
                  "w-full pl-10 pr-4 py-2 text-sm",
                  "border border-gray-300 rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                  "placeholder:text-gray-400"
                )}
              />
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {products.length} products
          </span>
        </div>
      </div>

      {/* Virtualized List */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-500">
              Loading products...
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="w-12 h-12 mb-2 text-gray-300" />
            <p>No products found</p>
            {searchTerm && <p className="text-sm">Try adjusting your search</p>}
          </div>
        ) : (
          <div
            style={{
              height: `${String(virtualizer.getTotalSize())}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const product = products[virtualRow.index];
              if (!product) return null;

              return (
                <ProductRow
                  key={product.id}
                  product={product}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${String(virtualRow.size)}px`,
                    transform: `translateY(${String(virtualRow.start)}px)`,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
