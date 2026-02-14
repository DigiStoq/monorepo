import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCreditNoteMutations } from "@/hooks/useCreditNotes";
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

describe("useCreditNotes Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { length: 0, item: () => null } });
  });

  it("createCreditNote should reduce customer balance", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useCreditNoteMutations());
    const { createCreditNote } = result.current;

    const data = {
      creditNoteNumber: "CN-001",
      customerId: "cust-1",
      customerName: "Test Customer",
      date: "2023-01-01",
      reason: "return",
    };
    const items = [
      {
        itemId: "item-1",
        itemName: "Item A",
        quantity: 1,
        unitPrice: 100,
        amount: 100,
      },
    ];

    await act(async () => {
      await createCreditNote(data, items);
    });

    // 1. Insert Header
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO credit_notes"),
      expect.arrayContaining(["CN-001", "cust-1"])
    );

    // 2. Insert Items
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO credit_note_items"),
      expect.any(Array)
    );

    // 3. Update Balance (Reduce receivable)
    // UPDATE customers SET current_balance = current_balance - ?
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE customers SET current_balance = current_balance - ?"
      ),
      expect.arrayContaining([100, "cust-1"])
    );
  });

  it("deleteCreditNote should restore customer balance", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useCreditNoteMutations());
    const { deleteCreditNote } = result.current;

    // Mock existing note
    mockExecute.mockResolvedValueOnce({
      rows: {
        item: () => ({
          customer_id: "cust-1",
          total: 100,
          credit_note_number: "CN-001",
        }),
      },
    });

    await act(async () => {
      await deleteCreditNote("cn-id-1");
    });

    // Restore Balance (Increase receivable)
    // UPDATE customers SET current_balance = current_balance + ?
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE customers SET current_balance = current_balance + ?"
      ),
      expect.arrayContaining([100, "cust-1"])
    );
  });
});
