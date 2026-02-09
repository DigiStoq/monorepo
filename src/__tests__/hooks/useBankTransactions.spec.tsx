import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBankTransactionMutations } from "@/hooks/useBankTransactions";
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

describe("useBankTransactions Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { length: 0, item: () => null } });
  });

  it("createTransaction should insert transaction and update account balance", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useBankTransactionMutations());
    const { createTransaction } = result.current;

    // Mock initial balance query
    mockExecute.mockResolvedValueOnce({
      rows: { _array: [{ current_balance: 1000 }] },
    });

    await act(async () => {
      await createTransaction({
        accountId: "bank-1",
        date: "2023-01-01",
        type: "deposit",
        amount: 500,
        description: "Deposit",
      });
    });

    // 1. Get Balance
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("SELECT current_balance FROM bank_accounts"),
      expect.arrayContaining(["bank-1"])
    );

    // 2. Insert Transaction (New Balance = 1000 + 500 = 1500)
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO bank_transactions"),
      expect.arrayContaining([1500])
    );

    // 3. Update Account
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE bank_accounts SET current_balance = ?"),
      expect.arrayContaining([1500, "bank-1"])
    );
  });

  it("deleteTransaction should reverse balance and delete", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useBankTransactionMutations());
    const { deleteTransaction } = result.current;

    // Mock get transaction
    mockExecute.mockResolvedValueOnce({
      rows: {
        _array: [{ account_id: "bank-1", type: "deposit", amount: 500 }],
      },
    });

    await act(async () => {
      await deleteTransaction("tx-1");
    });

    // 1. Reverse Balance (Deposit 500 -> Subtract 500)
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE bank_accounts SET current_balance = current_balance + ?"
      ),
      expect.arrayContaining([-500, "bank-1"])
    );
  });
});
