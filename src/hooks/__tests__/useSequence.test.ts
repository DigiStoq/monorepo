import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSequenceCounter, useNextSequencePreview } from "../useSequence";
import { useQuery } from "@powersync/react";

// Mock dependencies
vi.mock("@powersync/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/lib/powersync", () => ({
  getPowerSyncDatabase: vi.fn(() => ({
    execute: vi.fn(),
  })),
}));

describe("useSequence Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useSequenceCounter", () => {
    it("returns sequence counter data for sale_invoice", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
        data: [
          {
            id: "sale_invoice",
            prefix: "INV",
            next_number: 1001,
            padding: 4,
          },
        ],
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() => useSequenceCounter("sale_invoice"));

      expect(result.current.prefix).toBe("INV");
      expect(result.current.nextNumber).toBe(1001);
      expect(result.current.padding).toBe(4);
      expect(result.current.isLoading).toBe(false);
    });

    it("returns default values when no counter exists", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
        data: [],
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() => useSequenceCounter("sale_invoice"));

      expect(result.current.prefix).toBe("");
      expect(result.current.nextNumber).toBe(1);
      expect(result.current.padding).toBe(4);
    });

    it("returns loading state correctly", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
        data: [],
        isLoading: true,
        error: undefined,
      });

      const { result } = renderHook(() => useSequenceCounter("sale_invoice"));

      expect(result.current.isLoading).toBe(true);
    });

    it("returns correct prefix for purchase_invoice", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
        data: [
          {
            id: "purchase_invoice",
            prefix: "PUR",
            next_number: 2001,
            padding: 4,
          },
        ],
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() =>
        useSequenceCounter("purchase_invoice")
      );

      expect(result.current.prefix).toBe("PUR");
      expect(result.current.nextNumber).toBe(2001);
    });

    it("returns correct prefix for estimate", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
        data: [
          {
            id: "estimate",
            prefix: "EST",
            next_number: 100,
            padding: 3,
          },
        ],
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() => useSequenceCounter("estimate"));

      expect(result.current.prefix).toBe("EST");
      expect(result.current.nextNumber).toBe(100);
      expect(result.current.padding).toBe(3);
    });
  });

  describe("useNextSequencePreview", () => {
    it("generates correct preview with default padding", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
        data: [
          {
            id: "sale_invoice",
            prefix: "INV",
            next_number: 42,
            padding: 4,
          },
        ],
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() =>
        useNextSequencePreview("sale_invoice")
      );

      // With padding 4, number 42 should become 0042
      expect(result.current.preview).toBe("INV-0042");
      expect(result.current.isLoading).toBe(false);
    });

    it("generates correct preview with 5-digit padding", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
        data: [
          {
            id: "sale_invoice",
            prefix: "SALE",
            next_number: 7,
            padding: 5,
          },
        ],
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() =>
        useNextSequencePreview("sale_invoice")
      );

      expect(result.current.preview).toBe("SALE-00007");
    });

    it("generates correct preview when number exceeds padding", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
        data: [
          {
            id: "sale_invoice",
            prefix: "INV",
            next_number: 123456,
            padding: 4,
          },
        ],
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() =>
        useNextSequencePreview("sale_invoice")
      );

      // Number exceeds padding, should still show full number
      expect(result.current.preview).toBe("INV-123456");
    });

    it("handles all sequence types", () => {
      const sequenceTypes = [
        { type: "sale_invoice" as const, prefix: "INV" },
        { type: "purchase_invoice" as const, prefix: "PUR" },
        { type: "estimate" as const, prefix: "EST" },
        { type: "credit_note" as const, prefix: "CN" },
        { type: "payment_in" as const, prefix: "REC" },
        { type: "payment_out" as const, prefix: "PAY" },
        { type: "expense" as const, prefix: "EXP" },
        { type: "cheque" as const, prefix: "CHQ" },
      ];

      sequenceTypes.forEach(({ type, prefix }) => {
        (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
          data: [
            {
              id: type,
              prefix: prefix,
              next_number: 1001,
              padding: 4,
            },
          ],
          isLoading: false,
          error: undefined,
        });

        const { result } = renderHook(() => useNextSequencePreview(type));

        expect(result.current.preview).toBe(`${prefix}-1001`);
      });
    });
  });

  describe("Sequence Number Format", () => {
    it("formats number with correct padding", () => {
      const testCases = [
        { number: 1, padding: 4, expected: "0001" },
        { number: 42, padding: 4, expected: "0042" },
        { number: 999, padding: 4, expected: "0999" },
        { number: 1000, padding: 4, expected: "1000" },
        { number: 10000, padding: 4, expected: "10000" },
        { number: 1, padding: 6, expected: "000001" },
      ];

      testCases.forEach(({ number, padding, expected }) => {
        (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
          data: [
            {
              id: "sale_invoice",
              prefix: "INV",
              next_number: number,
              padding: padding,
            },
          ],
          isLoading: false,
          error: undefined,
        });

        const { result } = renderHook(() =>
          useNextSequencePreview("sale_invoice")
        );

        expect(result.current.preview).toBe(`INV-${expected}`);
      });
    });
  });
});
