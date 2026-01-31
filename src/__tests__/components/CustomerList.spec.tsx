import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CustomerList } from "@/features/customers/components/customer-list";
import type { Customer } from "@/features/customers/types";

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
        start: i * 100,
        size: 100,
        key: i,
      })),
    getTotalSize: () => count * 100,
  }),
}));

// Generate mock customers for testing
function generateMockCustomers(count: number): Customer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `cust-${i}`,
    name: `Customer ${i}`,
    type: i % 3 === 0 ? "customer" : i % 3 === 1 ? "supplier" : "both",
    phone: `555-${i.toString().padStart(4, "0")}`,
    email: `customer${i}@example.com`,
    address: `${i} Main Street`,
    city: `City ${i % 5}`,
    state: `State ${i % 3}`,
    zipCode: `1000${i}`,
    openingBalance: i * 100,
    currentBalance: i % 2 === 0 ? i * 50 : -i * 30,
    isActive: i % 4 !== 0,
    notes: `Notes for customer ${i}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })) as Customer[];
}

describe("CustomerList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when isLoading is true", () => {
    render(<CustomerList customers={null} isLoading={true} />);
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when customers array is empty", () => {
    render(<CustomerList customers={[]} />);
    expect(screen.getByText("No customers yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add your first customer or supplier to get started")
    ).toBeInTheDocument();
  });

  it("renders filtered empty state when hasActiveFilters is true", () => {
    render(<CustomerList customers={[]} hasActiveFilters={true} />);
    expect(screen.getByText("No customers found")).toBeInTheDocument();
    expect(
      screen.getByText("Try adjusting your search or filters")
    ).toBeInTheDocument();
  });

  it("renders customer count correctly", () => {
    const customers = generateMockCustomers(5);
    render(<CustomerList customers={customers} />);
    expect(screen.getByText("5 customers")).toBeInTheDocument();
  });

  it("renders singular 'customer' for single customer", () => {
    const customers = generateMockCustomers(1);
    render(<CustomerList customers={customers} />);
    expect(screen.getByText("1 customer")).toBeInTheDocument();
  });

  it("renders virtualized customers with correct structure", () => {
    const customers = generateMockCustomers(5);
    const { container } = render(<CustomerList customers={customers} />);

    // Should render buttons (customer cards)
    const buttons = container.querySelectorAll('button[type="button"]');
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.length).toBeLessThanOrEqual(customers.length);
  });

  it("displays customer type badges correctly", () => {
    const customers: Customer[] = [
      {
        id: "cust-1",
        name: "Test Customer",
        type: "customer",
        openingBalance: 0,
        currentBalance: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "supp-1",
        name: "Test Supplier",
        type: "supplier",
        openingBalance: 0,
        currentBalance: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "both-1",
        name: "Test Both",
        type: "both",
        openingBalance: 0,
        currentBalance: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(<CustomerList customers={customers} />);

    // Customer type shows "Customer"
    expect(screen.getByText("Customer")).toBeInTheDocument();
    // Supplier type shows "Supplier"
    expect(screen.getByText("Supplier")).toBeInTheDocument();
    // Both type shows "Both"
    expect(screen.getByText("Both")).toBeInTheDocument();
  });

  it("shows receivable balance (positive) correctly", () => {
    const customers: Customer[] = [
      {
        id: "cust-recv",
        name: "Receivable Customer",
        type: "customer",
        openingBalance: 0,
        currentBalance: 500, // Positive = receivable
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(<CustomerList customers={customers} />);

    expect(screen.getByText("$500.00")).toBeInTheDocument();
    expect(screen.getByText("To Receive")).toBeInTheDocument();
  });

  it("shows payable balance (negative) correctly", () => {
    const customers: Customer[] = [
      {
        id: "cust-pay",
        name: "Payable Customer",
        type: "supplier",
        openingBalance: 0,
        currentBalance: -300, // Negative = payable
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(<CustomerList customers={customers} />);

    expect(screen.getByText("$300.00")).toBeInTheDocument();
    expect(screen.getByText("To Pay")).toBeInTheDocument();
  });

  it("handles large customer lists with virtualization (renders limited items)", () => {
    const customers = generateMockCustomers(1000);

    const { container } = render(<CustomerList customers={customers} />);

    // Virtualization mock renders max 10 items
    const renderedItems = container.querySelectorAll('button[type="button"]');

    // Should render at most 10 items (from our mock)
    expect(renderedItems.length).toBeLessThanOrEqual(10);
    // But should render at least some items
    expect(renderedItems.length).toBeGreaterThan(0);

    // Customer count should still show total
    expect(screen.getByText("1000 customers")).toBeInTheDocument();
  });

  it("displays customer contact info", () => {
    const customers: Customer[] = [
      {
        id: "cust-contact",
        name: "Contact Customer",
        type: "customer",
        phone: "555-1234",
        email: "contact@example.com",
        address: "123 Main St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        openingBalance: 0,
        currentBalance: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(<CustomerList customers={customers} />);

    expect(screen.getByText("555-1234")).toBeInTheDocument();
    expect(screen.getByText("contact@example.com")).toBeInTheDocument();
    expect(screen.getByText("New York, NY")).toBeInTheDocument();
  });

  it("displays customer name correctly", () => {
    const customers: Customer[] = [
      {
        id: "cust-name",
        name: "John Doe",
        type: "customer",
        openingBalance: 0,
        currentBalance: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(<CustomerList customers={customers} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
