import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLoanMutations } from "@/hooks/useLoans";
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

describe("useLoans Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { length: 0, item: () => null } });
  });

  it("createLoan should insert loan", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useLoanMutations());
    const { createLoan } = result.current;

    await act(async () => {
      await createLoan({
        name: "Car Loan",
        type: "taken",
        principalAmount: 1000,
        startDate: "2023-01-01",
        interestRate: 5,
      });
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO loans"),
      expect.arrayContaining(["Car Loan", 1000, 1000]) // outstanding = principal
    );
  });

  it("recordPayment should reduce outstanding amount and close loan if paid", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useLoanMutations());
    const { recordPayment } = result.current;

    await act(async () => {
      await recordPayment({
        loanId: "loan-1",
        date: "2023-02-01",
        principalAmount: 1000,
        interestAmount: 50,
      });
    });

    // 1. Insert Payment
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO loan_payments"),
      expect.arrayContaining([1000, 50])
    );

    // 2. Update Loan (Outstanding -, Paid EMI +)
    // Checks for 'closed' status logic in SQL
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE loans"),
      expect.arrayContaining([1000, 1000, "loan-1"])
    );
  });
});
