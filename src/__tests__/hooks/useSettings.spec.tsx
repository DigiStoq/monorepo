import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useCompanySettingsMutations,
  useTaxRateMutations,
} from "@/hooks/useSettings";
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

describe("useSettings Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { length: 0, item: () => null } });
  });

  describe("Company Settings", () => {
    it("updateCompanySettings should insert if empty", async () => {
      getPowerSyncDatabase();
      const { result } = renderHook(() => useCompanySettingsMutations());
      const { updateCompanySettings } = result.current;

      mockTx.getAll.mockResolvedValueOnce([]); // No existing settings

      await act(async () => {
        await updateCompanySettings({ name: "My Company" });
      });

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO company_settings"),
        expect.arrayContaining(["My Company"])
      );
    });
  });

  describe("Tax Rates", () => {
    it("createTaxRate should insert tax rate", async () => {
      getPowerSyncDatabase();
      const { result } = renderHook(() => useTaxRateMutations());
      const { createTaxRate } = result.current;

      await act(async () => {
        await createTaxRate({
          name: "VAT",
          rate: 20,
          type: "percentage",
        });
      });

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO tax_rates"),
        expect.arrayContaining(["VAT", 20])
      );
    });
  });
});
