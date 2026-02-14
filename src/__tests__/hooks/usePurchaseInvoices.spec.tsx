import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePurchaseInvoiceMutations } from "@/hooks/usePurchaseInvoices";
import { getPowerSyncDatabase } from "@/lib/powersync";

// 1. Mock the specific parts we need to assert on
const mockExecute = vi.fn();
const mockTx = {
  execute: mockExecute,
  getAll: vi.fn(),
};

// 2. Mock PowerSyncDatabase
vi.mock("@powersync/web", () => {
  return {
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

describe("usePurchaseInvoices Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { length: 0, item: () => null } });
  });

  it("updateInvoice should perform atomic update with history logging", async () => {
    // SETUP
    getPowerSyncDatabase();
    const { result } = renderHook(() => usePurchaseInvoiceMutations());
    const { updateInvoice } = result.current;

    const invoiceId = "purch-123";
    const oldInvoiceData = {
      id: invoiceId,
      invoice_number: "PUR-001",
      customer_id: "supp-1",
      total: 100,
      amount_paid: 0,
      customer_name: "Supplier A",
      status: "received",
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
          invoiceNumber: "PUR-001",
          supplierId: "supp-1",
          supplierName: "Supplier A",
          date: "2023-01-01",
          dueDate: "2023-02-01",
          status: "received",
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
    // 1. Revert Old Stock (Decrease stock for purchase invoice? Wait.)
    // For Purchase Invoice:
    // If we bought 5, stock increased by 5.
    // If we revert: stock DECREASES by 5.
    // Logic: UPDATE items SET stock_quantity = stock_quantity - ? WHERE id = ?
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE items SET stock_quantity = stock_quantity - ?"
      ),
      expect.arrayContaining([5, "prod-1"])
    );

    // 2. Insert/Update Invoice & History
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO invoice_history"),
      expect.arrayContaining(["purch-123", "purchase", "updated"])
    );

    // 3. Add New Stock (Increase stock by 8)
    // Logic: UPDATE items SET stock_quantity = stock_quantity + ? WHERE id = ?
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE items SET stock_quantity = stock_quantity + ?"
      ),
      expect.arrayContaining([8, "prod-1"])
    );
  });
});
