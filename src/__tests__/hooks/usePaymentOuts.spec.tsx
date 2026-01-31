import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePaymentOutMutations } from "@/hooks/usePaymentOuts";
import { getPowerSyncDatabase } from "@/lib/powersync";

// Mock Setup
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

describe("usePaymentOuts Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { length: 0, item: () => null } });
  });

  it("createPayment should increase supplier balance (reduce debt) and update invoice", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => usePaymentOutMutations());
    const { createPayment } = result.current;

    await act(async () => {
      await createPayment({
        paymentNumber: "PAY-001",
        supplierId: "supp-1",
        supplierName: "Supplier A",
        date: "2023-01-01",
        amount: 50,
        paymentMode: "bank",
        invoiceId: "purch-1",
        invoiceNumber: "PUR-1",
      });
    });

    // 1. Insert Payment Out
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO payment_outs"),
      expect.arrayContaining(["PAY-001", 50])
    );

    // 2. Update Invoice (Amount Paid +, Amount Due -)
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE purchase_invoices"),
      expect.arrayContaining([50, 50, 50, "purch-1"])
    );

    // 3. Update Supplier Balance (Increase = Reduce Negative Debt)
    // UPDATE customers SET current_balance = current_balance + ?
    // Using relaxed string match to cover potential formatting
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("current_balance = current_balance + ?"),
      expect.arrayContaining([50, "supp-1"])
    );
  });

  it("deletePayment should decrease supplier balance (restore debt)", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => usePaymentOutMutations());
    const { deletePayment } = result.current;

    mockExecute.mockResolvedValueOnce({
      rows: {
        item: () => ({
          customer_id: "supp-1",
          invoice_id: "purch-1",
          amount: 50,
          payment_number: "PAY-001",
        }),
      },
    });

    await act(async () => {
      await deletePayment("pay-out-1");
    });

    // 1. Restore Supplier Balance (Decrease = Increase Negative Debt)
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("current_balance = current_balance - ?"),
      expect.arrayContaining([50, "supp-1"])
    );

    // 2. Restore Invoice
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE purchase_invoices"),
      expect.arrayContaining([50, 50, 50, "purch-1"])
    );
  });
});
