import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExpenseMutations } from "@/hooks/useExpenses";
import { getPowerSyncDatabase } from "@/lib/powersync";

const mockExecute = vi.fn();
// Mocking execute directly on db for expenses as it uses db.execute, not strict transactions yet?
// Actually implementation uses db.execute.
// My mock setup mocks PowerSyncDatabase which usually exposes execute.
// But wait, my manual mock in previous tests mocked writeTransaction mainly.
// I need to ensure `db.execute` is also mocked if it calls it directly.

const mockDb = {
  execute: mockExecute,
  getAll: vi.fn(),
  writeTransaction: vi.fn(async (cb) =>
    cb({ execute: mockExecute, getAll: vi.fn() })
  ),
  readTransaction: vi.fn(async (cb) =>
    cb({ execute: mockExecute, getAll: vi.fn() })
  ),
  connect: vi.fn(),
  close: vi.fn(),
  connected: true,
};

vi.mock("@powersync/web", () => ({
  PowerSyncDatabase: vi.fn(function () {
    return mockDb;
  }),
  Schema: vi.fn(),
  Table: vi.fn(),
  column: { text: vi.fn(), integer: vi.fn(), real: vi.fn() },
}));

describe("useExpenses Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { length: 0, item: () => null } });
  });

  it("createExpense should insert record", async () => {
    getPowerSyncDatabase(); // Init DB
    const { result } = renderHook(() => useExpenseMutations());
    const { createExpense } = result.current;

    await act(async () => {
      await createExpense({
        expenseNumber: "EXP-001",
        category: "office",
        date: "2023-01-01",
        amount: 50,
        paymentMode: "cash",
        description: "Office Supplies",
      });
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO expenses"),
      expect.arrayContaining(["EXP-001", "office", 50])
    );
  });

  it("updateExpense should update record", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useExpenseMutations());
    const { updateExpense } = result.current;

    await act(async () => {
      await updateExpense("exp-1", {
        amount: 60,
        description: "Updated Supplies",
      });
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE expenses SET"),
      expect.arrayContaining([60, "Updated Supplies", "exp-1"])
    );
  });

  it("deleteExpense should delete record", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useExpenseMutations());
    const { deleteExpense } = result.current;

    await act(async () => {
      await deleteExpense("exp-1");
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM expenses WHERE id = ?"),
      expect.arrayContaining(["exp-1"])
    );
  });
});
