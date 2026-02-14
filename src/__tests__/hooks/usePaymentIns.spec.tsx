import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePaymentInMutations } from "@/hooks/usePaymentIns";
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

describe("usePaymentIns Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { length: 0, item: () => null } });
  });

  it("createPayment should reduce customer balance and update invoice", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => usePaymentInMutations());
    const { createPayment } = result.current;

    await act(async () => {
      await createPayment({
        receiptNumber: "REC-001",
        customerId: "cust-1",
        customerName: "Customer A",
        date: "2023-01-01",
        amount: 50,
        paymentMode: "cash",
        invoiceId: "inv-1",
        invoiceNumber: "INV-1",
      });
    });

    // 1. Insert Payment
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO payment_ins"),
      expect.arrayContaining(["REC-001", 50])
    );

    // 2. Update Invoice (Amount Paid +, Amount Due -)
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE sale_invoices"),
      expect.arrayContaining([50, 50, 50, "inv-1"])
    );

    // 3. Update Customer Balance (Reduce)
    // 3. Update Customer Balance (Reduce)
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("current_balance = current_balance - ?"),
      expect.arrayContaining([50, "cust-1"])
    );
  });

  it("deletePayment should restore customer balance and invoice", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => usePaymentInMutations());
    const { deletePayment } = result.current;

    mockExecute.mockResolvedValueOnce({
      rows: {
        item: () => ({
          customer_id: "cust-1",
          invoice_id: "inv-1",
          amount: 50,
          receipt_number: "REC-001",
        }),
      },
    });

    await act(async () => {
      await deletePayment("pay-1");
    });

    // 1. Restore Customer Balance (Increase)
    // 1. Restore Customer Balance (Increase)
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("current_balance = current_balance + ?"),
      expect.arrayContaining([50, "cust-1"])
    );

    // 2. Restore Invoice (Amount Paid -, Amount Due +)
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE sale_invoices"),
      expect.arrayContaining([50, 50, 50, "inv-1"])
    );
  });
});
