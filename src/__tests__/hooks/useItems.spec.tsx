import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useItemMutations } from "@/hooks/useItems";
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

describe("useItems Hook (Inventory)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { length: 0, item: () => null } });
  });

  it("createItem should insert item and log history", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useItemMutations());
    const { createItem } = result.current;

    await act(async () => {
      await createItem({
        name: "Test Item",
        sku: "TEST-001",
        type: "product",
        unit: "pcs",
        salePrice: 100,
        purchasePrice: 50,
        stockQuantity: 10,
        lowStockAlert: 2,
      });
    });

    // Verify INSERT into items
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO items"),
      expect.arrayContaining(["Test Item", "TEST-001", 10])
    );

    // Verify INSERT into item_history
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO item_history"),
      expect.arrayContaining(["created", 'Item "Test Item" created'])
    );
  });

  it("updateItem should log detailed diffs", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useItemMutations());
    const { updateItem } = result.current;

    // Mock existing item fetch
    mockTx.getAll.mockResolvedValueOnce([
      {
        id: "item-1",
        name: "Old Name",
        stock_quantity: 10,
        sale_price: 100,
      },
    ]);

    await act(async () => {
      await updateItem("item-1", {
        name: "New Name",
        salePrice: 150,
      });
    });

    // Verify UPDATE
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE items SET name = ?, sale_price = ?, updated_at = ? WHERE id = ?"
      ),
      expect.arrayContaining(["New Name", 150, "item-1"])
    );

    // Verify History Diff
    // We expect the history description to contain the changes
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO item_history"),
      expect.arrayContaining([
        "updated",
        expect.stringContaining("Name: 'Old Name' -> 'New Name'"),
        expect.stringContaining("Sale Price: 100 -> 150"),
      ])
    );
  });

  it("adjustStock should atomically update and log", async () => {
    getPowerSyncDatabase();
    const { result } = renderHook(() => useItemMutations());
    const { adjustStock } = result.current;

    // Mock existing item check
    mockExecute.mockResolvedValueOnce({
      rows: { item: () => ({ stock_quantity: 10, name: "Test Item" }) },
    });

    await act(async () => {
      await adjustStock("item-1", 5); // Add 5
    });

    // Verify UPDATE stock
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE items SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?"
      ),
      expect.arrayContaining([5, "item-1"])
    );

    // Verify History
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO item_history"),
      expect.arrayContaining([
        "stock_adjusted",
        expect.stringContaining('Stock adjusted for "Test Item": 10 → 15 (+5)'),
      ])
    );
  });
});
