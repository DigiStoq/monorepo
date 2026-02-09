import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ItemList } from "@/features/inventory/components/item-list";
import type { Item } from "@/features/inventory/types";

// Mock useCurrency hook
vi.mock("@/hooks/useCurrency", () => ({
  useCurrency: () => ({
    formatCurrency: (value: number) => `$${value.toFixed(2)}`,
  }),
}));

// Mock the virtualizer since JSDOM doesn't support scroll measurements
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: Math.min(count, 10) }, (_, i) => ({
        index: i,
        start: i * 96,
        size: 96,
        key: i,
      })),
    getTotalSize: () => count * 96,
  }),
}));

// Generate mock items for testing
function generateMockItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `Test Item ${i}`,
    sku: `SKU-${i.toString().padStart(4, "0")}`,
    type: i % 3 === 0 ? "service" : "product",
    salePrice: 100 + i * 10,
    purchasePrice: 50 + i * 5,
    stockQuantity: i % 5 === 0 ? 0 : 10 + i,
    lowStockAlert: 5,
    unit: "pcs",
    category: `Category ${i % 3}`,
    description: `Description for item ${i}`,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })) as Item[];
}

describe("ItemList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when isLoading is true", () => {
    render(<ItemList items={null} isLoading={true} />);
    // CardSkeleton renders multiple skeleton items
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when items array is empty", () => {
    render(<ItemList items={[]} />);
    expect(screen.getByText("No items yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add your first product or service to get started")
    ).toBeInTheDocument();
  });

  it("renders filtered empty state when hasActiveFilters is true", () => {
    render(<ItemList items={[]} hasActiveFilters={true} />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
    expect(
      screen.getByText("Try adjusting your search or filters")
    ).toBeInTheDocument();
  });

  it("renders item count correctly", () => {
    const items = generateMockItems(5);
    render(<ItemList items={items} />);
    expect(screen.getByText("5 items")).toBeInTheDocument();
  });

  it("renders singular 'item' for single item", () => {
    const items = generateMockItems(1);
    render(<ItemList items={items} />);
    expect(screen.getByText("1 item")).toBeInTheDocument();
  });

  it("renders virtualized items with correct structure", () => {
    const items = generateMockItems(5);
    const { container } = render(<ItemList items={items} />);

    // Should render buttons (item cards)
    const buttons = container.querySelectorAll('button[type="button"]');
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.length).toBeLessThanOrEqual(items.length);
  });

  it("renders product items with stock information", () => {
    const items: Item[] = [
      {
        id: "product-1",
        name: "Product With Stock",
        sku: "SKU-001",
        type: "product",
        salePrice: 100,
        purchasePrice: 50,
        stockQuantity: 25,
        lowStockAlert: 5,
        unit: "pcs",
        category: "Electronics",
        description: "A test product",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(<ItemList items={items} />);

    expect(screen.getByText("Product With Stock")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("25 pcs")).toBeInTheDocument();
  });

  it("renders service items without stock information", () => {
    const items: Item[] = [
      {
        id: "service-1",
        name: "Service Item",
        sku: "SVC-001",
        type: "service",
        salePrice: 200,
        purchasePrice: 0,
        stockQuantity: 0,
        lowStockAlert: 0,
        unit: "",
        category: "Services",
        description: "A test service",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(<ItemList items={items} />);

    expect(screen.getByText("Service Item")).toBeInTheDocument();
    expect(screen.getByText("$200.00")).toBeInTheDocument();
    // Service items should not show stock quantity text with unit
    expect(screen.queryByText(/\d+ pcs$/)).not.toBeInTheDocument();
  });

  it("shows out of stock badge for zero stock products", () => {
    const items: Item[] = [
      {
        id: "out-of-stock-1",
        name: "Out of Stock Product",
        sku: "SKU-OOS",
        type: "product",
        salePrice: 100,
        purchasePrice: 50,
        stockQuantity: 0,
        lowStockAlert: 5,
        unit: "pcs",
        category: "Test",
        description: "Out of stock product",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(<ItemList items={items} />);

    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it("handles large item lists with virtualization (renders limited items)", () => {
    // Generate 1000 items to test virtualization
    const items = generateMockItems(1000);

    const { container } = render(<ItemList items={items} />);

    // Virtualization mock renders max 10 items
    const renderedItems = container.querySelectorAll('button[type="button"]');

    // Should render at most 10 items (from our mock)
    expect(renderedItems.length).toBeLessThanOrEqual(10);
    // But should render at least some items
    expect(renderedItems.length).toBeGreaterThan(0);

    // Item count should still show total
    expect(screen.getByText("1000 items")).toBeInTheDocument();
  });

  it("displays SKU when available", () => {
    const items: Item[] = [
      {
        id: "item-sku",
        name: "Item with SKU",
        sku: "UNIQUE-SKU-123",
        type: "product",
        salePrice: 150,
        purchasePrice: 75,
        stockQuantity: 10,
        lowStockAlert: 2,
        unit: "pcs",
        category: "Test",
        description: "",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(<ItemList items={items} />);
    expect(screen.getByText(/UNIQUE-SKU-123/)).toBeInTheDocument();
  });

  it("displays category badge when available", () => {
    const items: Item[] = [
      {
        id: "item-cat",
        name: "Item with Category",
        sku: "SKU-CAT",
        type: "product",
        salePrice: 100,
        purchasePrice: 50,
        stockQuantity: 10,
        lowStockAlert: 2,
        unit: "pcs",
        category: "Electronics",
        description: "",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(<ItemList items={items} />);
    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });
});
