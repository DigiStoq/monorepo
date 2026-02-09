import { renderHook, waitFor } from "@testing-library/react";
import { usePaymentsByInvoiceId } from "@/hooks/usePaymentIns";
import { usePaymentOutsByInvoiceId } from "@/hooks/usePaymentOuts";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependent hooks
vi.mock("@powersync/react", () => ({
  useQuery: vi.fn((query, params) => {
    // Mock Sales Invoice Payments
    if (query.includes("FROM payment_ins WHERE invoice_id")) {
      if (params[0] === "inv-123") {
        return {
          data: [
            {
              id: "pay-1",
              receipt_number: "RCPT-001",
              customer_id: "cust-1",
              customer_name: "John Doe",
              date: "2024-01-01",
              amount: 100,
              payment_mode: "cash",
              reference_number: "REF123",
              invoice_id: "inv-123",
              invoice_number: "INV-001",
              notes: "Partial payment",
              created_at: "2024-01-01T10:00:00Z",
              updated_at: "2024-01-01T10:00:00Z",
            },
          ],
          isLoading: false,
          error: undefined,
        };
      }
      return { data: [], isLoading: false, error: undefined };
    }

    // Mock Purchase Invoice Payments
    if (query.includes("FROM payment_outs WHERE invoice_id")) {
      if (params[0] === "pur-123") {
        return {
          data: [
            {
              id: "pout-1",
              payment_number: "PAY-001",
              customer_id: "supp-1",
              customer_name: "Supplier Inc",
              date: "2024-01-02",
              amount: 500,
              payment_mode: "bank",
              reference_number: "REF456",
              invoice_id: "pur-123",
              invoice_number: "PUR-001",
              notes: "Bank transfer",
              created_at: "2024-01-02T10:00:00Z",
              updated_at: "2024-01-02T10:00:00Z",
            },
          ],
          isLoading: false,
          error: undefined,
        };
      }
      return { data: [], isLoading: false, error: undefined };
    }

    return { data: [], isLoading: false, error: undefined };
  }),
}));

vi.mock("@/lib/powersync", () => ({
  getPowerSyncDatabase: vi.fn(),
}));

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: {
    getState: () => ({
      user: {
        id: "user-1",
        email: "test@example.com",
        user_metadata: { full_name: "Test User" },
      },
    }),
  },
}));

describe("Invoice Payment Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("usePaymentsByInvoiceId (Sales)", () => {
    it("should return payments for a given invoice ID", async () => {
      const { result } = renderHook(() => usePaymentsByInvoiceId("inv-123"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.payments).toHaveLength(1);
      expect(result.current.payments[0]).toEqual(
        expect.objectContaining({
          id: "pay-1",
          amount: 100,
          invoiceId: "inv-123",
        })
      );
    });

    it("should return empty array when no invoice ID is provided", async () => {
      const { result } = renderHook(() => usePaymentsByInvoiceId(null));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.payments).toHaveLength(0);
    });
  });

  describe("usePaymentOutsByInvoiceId (Purchases)", () => {
    it("should return payments for a given invoice ID", async () => {
      const { result } = renderHook(() => usePaymentOutsByInvoiceId("pur-123"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.payments).toHaveLength(1);
      expect(result.current.payments[0]).toEqual(
        expect.objectContaining({
          id: "pout-1",
          amount: 500,
          invoiceId: "pur-123",
        })
      );
    });

    it("should return empty array when no invoice ID is provided", async () => {
      const { result } = renderHook(() => usePaymentOutsByInvoiceId(null));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.payments).toHaveLength(0);
    });
  });
});
