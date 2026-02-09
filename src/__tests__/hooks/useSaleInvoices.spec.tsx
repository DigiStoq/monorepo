import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSaleInvoiceMutations } from "@/hooks/useSaleInvoices"; // Correct hook
import { getPowerSyncDatabase } from "@/lib/powersync";

// 1. Mock the specific parts we need to assert on
const mockExecute = vi.fn();
const mockTx = {
  execute: mockExecute,
  getAll: vi.fn(),
};

// 2. Mock PowerSyncDatabase constructor to return our controlled mocks
vi.mock("@powersync/web", () => {
  return {
    // Use a regular function instead of arrow function for constructor compatibility
    PowerSyncDatabase: vi.fn(function () {
      return {
        execute: mockExecute,
        getAll: vi.fn(() => []),
        writeTransaction: vi.fn(async (callback) => {
          return await callback(mockTx);
        }),
        readTransaction: vi.fn(async (callback) => {
          return await callback(mockTx);
        }),
        connect: vi.fn(),
        close: vi.fn(),
        connected: true,
      };
    }),
    Schema: vi.fn(),
    Table: vi.fn(),
    column: { text: vi.fn(), integer: vi.fn(), real: vi.fn() },
  };
});

// Mock Auth Store
vi.mock("@/stores/auth-store", () => ({
  useAuthStore: {
    getState: () => ({
      user: { id: "test-user-id", user_metadata: { full_name: "Test User" } },
    }),
  },
}));

describe("useSaleInvoices Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for execute to return empty rows
    mockExecute.mockResolvedValue({ rows: { length: 0, item: () => null } });
  });

  it("updateInvoice should perform atomic update with history logging", async () => {
    // SETUP
    // Ensure DB is initialized (though mock handles it)
    getPowerSyncDatabase();

    // Use the mutation hook!
    const { result } = renderHook(() => useSaleInvoiceMutations());
    const { updateInvoice } = result.current;

    const invoiceId = "inv-123";
    const oldInvoiceData = {
      id: invoiceId,
      invoice_number: "INV-001",
      customer_id: "cust-1",
      total: 100,
      amount_paid: 20,
    };
    const oldItemData = {
      id: "item-line-1",
      item_id: "prod-1",
      quantity: 5,
    };

    // MOCK RESPONSES
    mockExecute
      .mockResolvedValueOnce({ rows: { item: () => oldInvoiceData } }) // 1. Select Old Invoice
      .mockResolvedValueOnce({ rows: { length: 1, item: () => oldItemData } }) // 2. Select Old Items
      .mockResolvedValue({ rows: { length: 0 } }); // Default for updates

    // ACT
    await act(async () => {
      await updateInvoice(
        invoiceId,
        {
          invoiceNumber: "INV-001",
          customerId: "cust-1",
          customerName: "Customer A",
          date: "2023-01-01",
          dueDate: "2023-02-01",
          status: "paid",
          discountAmount: 0,
        },
        [
          {
            itemId: "prod-1",
            itemName: "Product A",
            quantity: 8,
            unitPrice: 20,
            amount: 160,
            unit: "pcs",
          },
        ]
      );
    });

    // ASSERT
    // Verify sequence of atomic operations

    // 1. Restore Stock (Old Qty: 5)
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE items SET stock_quantity = stock_quantity + ?"
      ),
      expect.arrayContaining([5, "prod-1"])
    );

    // 2. Insert/Update Invoice - Checking history insert
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO invoice_history"),
      expect.arrayContaining(["inv-123", "sale", "updated"])
    );

    // 3. Deduct New Stock (New Qty: 8)
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE items SET stock_quantity = stock_quantity - ?"
      ),
      expect.arrayContaining([8, "prod-1"])
    );
  });
});
