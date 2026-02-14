import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCustomerMutations } from "@/hooks/useCustomers";
import { getPowerSyncDatabase } from "@/lib/powersync";

const mockExecute = vi.fn();
// useCustomers uses db.execute mostly
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

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useCustomerMutations Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { length: 0, item: () => null } });
  });

  it("createCustomer should insert customer with opening balance", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useCustomerMutations());

    await act(async () => {
      await result.current.createCustomer({
        name: "Test Customer",
        type: "customer",
        openingBalance: 100,
      });
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO customers"),
      expect.arrayContaining(["Test Customer", 100, 100]) // opening = 100, current = 100
    );
  });

  it("updateCustomer should update fields", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useCustomerMutations());

    await act(async () => {
      await result.current.updateCustomer("cust-1", {
        name: "Updated Name",
        email: "test@example.com",
      });
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE customers SET name = ?, email = ?"),
      expect.arrayContaining(["Updated Name", "test@example.com", "cust-1"])
    );
  });

  it("updateCustomerBalance should adjust balance", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useCustomerMutations());

    await act(async () => {
      await result.current.updateCustomerBalance("cust-1", 50);
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE customers SET current_balance = current_balance + ?"
      ),
      expect.arrayContaining([50, "cust-1"])
    );
  });

  it("deleteCustomer should delete customer", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useCustomerMutations());

    await act(async () => {
      await result.current.deleteCustomer("cust-1");
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM customers WHERE id = ?"),
      ["cust-1"]
    );
  });

  it("toggleCustomerActive should toggle is_active status", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useCustomerMutations());

    await act(async () => {
      await result.current.toggleCustomerActive("cust-1", false);
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE customers SET is_active = ?"),
      expect.arrayContaining([0, "cust-1"])
    );
  });

  it("toggleCustomerActive should set active to true", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useCustomerMutations());

    await act(async () => {
      await result.current.toggleCustomerActive("cust-2", true);
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE customers SET is_active = ?"),
      expect.arrayContaining([1, "cust-2"])
    );
  });

  it("createCustomer should use default opening balance of 0", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useCustomerMutations());

    await act(async () => {
      await result.current.createCustomer({
        name: "No Balance Customer",
        type: "supplier",
      });
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO customers"),
      expect.arrayContaining(["No Balance Customer", 0, 0]) // opening = 0, current = 0
    );
  });
});
