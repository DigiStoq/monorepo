import { renderHook } from "@testing-library/react";
import {
  useSalesSummaryReport,
  useProfitLossReport,
  useStockSummaryReport,
  useCashFlowReport,
} from "../useReports";
import { useQuery } from "@powersync/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks
vi.mock("@powersync/react", () => ({
  useQuery: vi.fn(),
}));

describe("useReports Hooks (Desktop)", () => {
  const mockDateRange = { from: "2023-01-01", to: "2023-01-31" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useSalesSummaryReport", () => {
    it("calculates summary correctly", () => {
      (useQuery as any).mockImplementation((sql: string) => {
        if (sql.includes("COALESCE(SUM(total), 0) as total_sales")) {
          return {
            data: [
              {
                total_sales: 5000,
                total_invoices: 5,
                total_paid: 3000,
                total_due: 2000,
              },
            ],
            isLoading: false,
          };
        }
        if (
          sql.includes("FROM sale_invoices") &&
          sql.includes("GROUP BY customer_id")
        ) {
          return {
            data: [{ customer_id: "c1", customer_name: "Cust1", amount: 3000 }],
            isLoading: false,
          };
        }
        if (sql.includes("FROM sale_invoice_items")) {
          return {
            data: [
              { item_id: "i1", item_name: "Item1", quantity: 10, amount: 1000 },
            ],
            isLoading: false,
          };
        }
        if (sql.includes("strftime('%b', date)")) {
          return { data: [{ month: "Jan", amount: 5000 }], isLoading: false };
        }
        return { data: [], isLoading: false };
      });

      const { result } = renderHook(() => useSalesSummaryReport(mockDateRange));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.summary).toEqual({
        totalSales: 5000,
        totalInvoices: 5,
        totalPaid: 3000,
        totalDue: 2000,
        averageOrderValue: 1000,
        topCustomers: [
          { customerId: "c1", customerName: "Cust1", amount: 3000 },
        ],
        topItems: [
          { itemId: "i1", itemName: "Item1", quantity: 10, amount: 1000 },
        ],
        salesByMonth: [{ month: "Jan", amount: 5000 }],
      });
    });
  });

  describe("useProfitLossReport", () => {
    it("calculates net profit correctly", () => {
      (useQuery as any).mockImplementation((sql: string) => {
        // Revenue (Sales)
        if (sql.includes("FROM sale_invoices") && sql.includes("COALESCE")) {
          return { data: [{ total: 10000 }], isLoading: false };
        }
        // COGS (Items sold * purchase price)
        if (sql.includes("FROM sale_invoice_items")) {
          return { data: [{ total: 4000 }], isLoading: false };
        }
        // Expenses
        if (sql.includes("FROM expenses")) {
          return { data: [{ total: 1500 }], isLoading: false };
        }
        return { data: [], isLoading: false };
      });

      const { result } = renderHook(() => useProfitLossReport(mockDateRange));

      expect(result.current.isLoading).toBe(false);

      // Expected: Rev 10000, COGS 4000, Expenses 1500
      // Gross = 6000, Net = 4500
      const report = result.current.report;
      expect(report?.revenue.total).toBe(10000);
      expect(report?.expenses.costOfGoodsSold).toBe(4000);
      expect(report?.grossProfit).toBe(6000);
      expect(report?.expenses.total).toBe(5500); // COGS + Opex (4000 + 1500)
      expect(report?.netProfit).toBe(4500);
    });
  });

  describe("useStockSummaryReport", () => {
    it("calculates inventory correctly", () => {
      (useQuery as any).mockImplementation((sql: string) => {
        if (sql.includes("FROM items")) {
          return {
            data: [
              {
                id: "1",
                name: "Item A",
                stock_quantity: 10,
                purchase_price: 100,
                low_stock_alert: 5,
              },
              {
                id: "2",
                name: "Item B",
                stock_quantity: 2,
                purchase_price: 50,
                low_stock_alert: 5,
              },
              {
                id: "3",
                name: "Item C",
                stock_quantity: 0,
                purchase_price: 20,
                low_stock_alert: 5,
              },
            ],
            isLoading: false,
          };
        }
        return { data: [], isLoading: false };
      });

      // Note: Desktop hook returns { data: StockSummaryItem[] }
      const { result } = renderHook(() => useStockSummaryReport());

      expect(result.current.isLoading).toBe(false);
      const items = result.current.data;

      expect(items).toHaveLength(3);
      expect(items[0].stockValue).toBe(1000);
    });
  });

  describe("useCashFlowReport", () => {
    it("calculates net cash flow", () => {
      (useQuery as any).mockImplementation((sql: string) => {
        if (sql.includes("'sales_receipts' as type")) {
          // Inflows
          return {
            data: [
              { type: "sales_receipts", total: 5000 },
              { type: "cash_deposits", total: 1000 },
            ],
            isLoading: false,
          };
        }
        if (sql.includes("'purchase_payments' as type")) {
          // Outflows
          return {
            data: [
              { type: "purchase_payments", total: 2000 },
              { type: "expenses", total: 500 },
              { type: "cash_withdrawals", total: 0 },
            ],
            isLoading: false,
          };
        }
        if (sql.includes("openingData")) {
          return { data: [{ balance: 0 }], isLoading: false };
        }
        return { data: [], isLoading: false };
      });

      const { result } = renderHook(() => useCashFlowReport(mockDateRange));

      // Inflows: 6000
      // Outflows: 2500
      // Net: 3500
      const report = result.current.report;
      expect(report?.inflows.total).toBe(6000);
      expect(report?.outflows.total).toBe(2500);
      expect(report?.netCashFlow).toBe(3500);
    });
  });
});
