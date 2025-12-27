// Page
export { ItemsPage } from "./items-page";

// Components
export * from "./components";

// Types
export type {
  Item,
  ItemFormData,
  ItemFilters,
  ItemType,
  Category,
  // Legacy types
  Product,
  ProductFormData,
  ProductFilters,
} from "./types";

// Legacy exports
export { ProductList } from "./ProductList";
export {
  useProducts,
  useProductSearch,
  useLowStockProducts,
} from "./hooks/useProducts";
