import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSaleInvoiceMutations } from "@/hooks/useSaleInvoices";
import { getPowerSyncDatabase } from "@/lib/powersync";

// Mock Setup (Reuse pattern)
const mockExecute = vi.fn();
const mockTx = { execute: mockExecute, getAll: vi.fn() };

vi.mock("@powersync/web", () => ({
  PowerSyncDatabase: vi.fn(function () {
    return {
      execute: mockExecute,
      getAll: vi.fn(() => []),
      writeTransaction: vi.fn(async (cb) => cb(mockTx)),
      readTransaction: vi.fn(async (cb) => cb(mockTx)),
      connect: vi.fn(),
      close: vi.fn(),
      connected: true,
    };
  }),
  Schema: vi.fn(),
  Table: vi.fn(),
  column: { text: vi.fn(), integer: vi.fn(), real: vi.fn() },
}));

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: { getState: () => ({ user: { id: "u1" } }) },
}));

describe("Sales Guardrails (updateInvoice)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { length: 0, item: () => null } });
  });

  it("should throw error if item is expired", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useSaleInvoiceMutations());
    const { updateInvoice } = result.current;

    const oldInvoice = { id: "inv-1", total: 100 };
    const expiredItem = {
      id: "prod-exp",
      name: "Expired Milk",
      expiry_date: "2000-01-01", // Past date
      stock_quantity: 100,
    };

    // Mocks:
    // 1. Get Old Invoice
    mockExecute.mockResolvedValueOnce({ rows: { item: () => oldInvoice } });
    // 2. Get Old Items (Empty)
    mockExecute.mockResolvedValueOnce({ rows: { length: 0 } });

    // 3. Loop: Restore Stock (Skipped as old items empty)

    // 4. Validate New Items -> Get Item Info
    mockExecute.mockResolvedValueOnce({
      rows: { length: 1, item: () => expiredItem },
    });

    await expect(
      updateInvoice(
        "inv-1",
        {
          invoiceNumber: "INV-1",
          customerId: "c1",
          customerName: "C1",
          date: "2023-01-01", // Invoice date
          status: "paid",
        } as any, // partial data
        [
          {
            itemId: "prod-exp",
            quantity: 1,
            unitPrice: 10,
            amount: 10,
            unit: "pcs",
            itemName: "Expired Milk",
          },
        ]
      )
    ).rejects.toThrow(/has expired/);
  });

  it("should throw error if insufficient stock", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useSaleInvoiceMutations());
    const { updateInvoice } = result.current;

    const oldInvoice = { id: "inv-1", total: 100 };
    const lowStockItem = {
      id: "prod-low",
      name: "Gold Bar",
      type: "product",
      stock_quantity: 5, // Only 5 available
    };

    // Mocks:
    mockExecute.mockResolvedValueOnce({ rows: { item: () => oldInvoice } });
    mockExecute.mockResolvedValueOnce({ rows: { length: 0 } });

    // Validate New Items -> Get Item Info
    mockExecute.mockResolvedValueOnce({
      rows: { length: 1, item: () => lowStockItem },
    });

    await expect(
      updateInvoice(
        "inv-1",
        {
          invoiceNumber: "INV-1",
          customerId: "c1",
          customerName: "C1",
          date: "2023-01-01",
          status: "paid",
        } as any,
        [
          {
            itemId: "prod-low",
            quantity: 10,
            unitPrice: 10,
            amount: 100,
            unit: "pcs",
            itemName: "Gold Bar",
          },
        ] // Request 10
      )
    ).rejects.toThrow(/Insufficient stock/);
  });
});
