import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEstimateMutations } from "@/hooks/useEstimates";
import { getPowerSyncDatabase } from "@/lib/powersync";

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

describe("useEstimates Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { length: 0, item: () => null } });
  });

  it("convertEstimateToInvoice should create invoice and update estimate status", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useEstimateMutations());
    const { convertEstimateToInvoice } = result.current;

    const estimate = {
      id: "est-1",
      estimateNumber: "EST-001",
      customerId: "cust-1",
      customerName: "Customer A",
      date: "2023-01-01",
      validUntil: "2023-02-01",
      status: "accepted",
      items: [],
      subtotal: 100,
      taxAmount: 0,
      discountAmount: 0,
      total: 100,
      createdAt: "",
      updatedAt: "",
    };
    const items = [
      {
        id: "item-row-1",
        estimateId: "est-1",
        itemId: "prod-1",
        itemName: "Product A",
        quantity: 1,
        unitPrice: 100,
        amount: 100,
        discountPercent: 0,
        taxPercent: 0,
      },
    ];

    // Mock sequence result
    mockExecute.mockResolvedValueOnce({
      rows: {
        length: 1,
        item: () => ({ prefix: "INV", next_number: 100, padding: 5 }),
      },
    });

    await act(async () => {
      await convertEstimateToInvoice(
        estimate as any,
        items as any,
        "2023-02-01"
      );
    });

    // 1. Get Sequence (Mocked above)

    // 2. Insert Sale Invoice
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO sale_invoices"),
      expect.arrayContaining(["INV-00100", "cust-1", 100])
    );

    // 3. Insert Invoice Items
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO sale_invoice_items"),
      expect.arrayContaining(["prod-1", "Product A"])
    );

    // 4. Update Estimate Status (Converted)
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE estimates SET status = 'converted', converted_to_invoice_id = ?, updated_at = ? WHERE id = ?"
      ),
      expect.arrayContaining(["est-1"])
    );

    // 5. History Logging
    // Expect Estimate History
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO invoice_history"),
      expect.arrayContaining(["estimate", "converted"])
    );
    // Expect Invoice History
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO invoice_history"),
      expect.arrayContaining(["sale", "created"])
    );
  });
});
