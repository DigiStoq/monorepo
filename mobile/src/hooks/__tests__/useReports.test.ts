import { renderHook } from '@testing-library/react-native';
import { 
  useSalesSummaryReport, 
  useProfitLossReport,
  useStockSummaryReport,
  useCashFlowReport
} from '../useReports';
import { useQuery } from '@powersync/react-native';

// Mocks
jest.mock('@powersync/react-native', () => ({
  useQuery: jest.fn(),
  usePowerSync: () => ({
      db: { getAll: jest.fn() } // If used directly, but hooks use useQuery
  })
}));

describe('useReports Hooks', () => {
    const mockDateRange = { from: '2023-01-01', to: '2023-01-31' };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('useSalesSummaryReport', () => {
        it('calculates summary correctly', () => {
            (useQuery as jest.Mock).mockImplementation((sql: string) => {
                if (sql.includes('COALESCE(SUM(total), 0) as total_sales')) {
                    return { data: [{ total_sales: 5000, total_invoices: 5, total_paid: 3000, total_due: 2000 }], loading: false };
                }
                if (sql.includes('FROM sale_invoices') && sql.includes('GROUP BY customer_id')) {
                    return { data: [{ customer_id: 'c1', customer_name: 'Cust1', amount: 3000 }], loading: false };
                }
                if (sql.includes('FROM sale_invoice_items')) {
                    return { data: [{ item_id: 'i1', item_name: 'Item1', quantity: 10, amount: 1000 }], loading: false };
                }
                if (sql.includes('strftime(\'%m\', date)')) {
                    return { data: [{ month: '01', amount: 5000 }], loading: false };
                }
                return { data: [], loading: false };
            });

            const { result } = renderHook(() => useSalesSummaryReport(mockDateRange));

            expect(result.current.isLoading).toBe(false);
            expect(result.current.summary).toEqual({
                totalSales: 5000,
                totalInvoices: 5,
                totalPaid: 3000,
                totalDue: 2000,
                averageOrderValue: 1000,
                topCustomers: [{ customerId: 'c1', customerName: 'Cust1', amount: 3000 }],
                topItems: [{ itemId: 'i1', itemName: 'Item1', quantity: 10, amount: 1000 }],
                salesByMonth: [{ month: '01', amount: 5000 }]
            });
        });
    });

    describe('useProfitLossReport', () => {
        it('calculates net profit correctly', () => {
             (useQuery as jest.Mock).mockImplementation((sql: string) => {
                // Revenue
                if (sql.includes('FROM sale_invoices') && sql.includes('COALESCE')) {
                    return { data: [{ total: 10000 }], loading: false };
                }
                // COGS (Purchases)
                if (sql.includes('FROM purchase_invoices')) {
                    return { data: [{ total: 4000 }], loading: false };
                }
                // Expenses
                if (sql.includes('FROM expenses')) {
                    return { data: [{ category: 'Rent', amount: 1000 }, { category: 'Utilities', amount: 500 }], loading: false };
                }
                return { data: [], loading: false };
            });

            const { result } = renderHook(() => useProfitLossReport(mockDateRange));

            expect(result.current.isLoading).toBe(false);
            
            // Revenue: 10000
            // COGS: 4000
            // Gross Profit: 6000
            // Expenses: 1500
            // Net Profit: 4500
            
            const report = result.current.data;
            expect(report?.revenue.total).toBe(10000);
            expect(report?.cogs.total).toBe(4000);
            expect(report?.grossProfit).toBe(6000);
            expect(report?.expenses.total).toBe(1500);
            expect(report?.netProfit).toBe(4500);
        });
    });

    describe('useStockSummaryReport', () => {
        it('calculates inventory value and stock counts', () => {
             (useQuery as jest.Mock).mockImplementation((sql: string) => {
                if (sql.includes('FROM items')) {
                    return { data: [
                        { id: '1', name: 'Item A', stock_quantity: 10, purchase_price: 100, low_stock_alert: 5 }, // In Stock. Value 1000.
                        { id: '2', name: 'Item B', stock_quantity: 2, purchase_price: 50, low_stock_alert: 5 },   // Low Stock. Value 100.
                        { id: '3', name: 'Item C', stock_quantity: 0, purchase_price: 20, low_stock_alert: 5 }    // Out of Stock. Value 0.
                    ], loading: false };
                }
                return { data: [], loading: false };
            });

            const { result } = renderHook(() => useStockSummaryReport());

            expect(result.current.isLoading).toBe(false);
            const summary = result.current.summary;
            
            expect(summary?.totalItems).toBe(3);
            expect(summary?.totalValue).toBe(1100); // 1000 + 100 + 0
            expect(summary?.lowStockCount).toBe(1);
            expect(summary?.outOfStockCount).toBe(1);
        });
    });

    describe('useCashFlowReport', () => {
        it('calculates net cash flow', () => {
            (useQuery as jest.Mock).mockImplementation((sql: string) => {
                if (sql.includes('\'Customer Payments\' as type')) {
                    // Inflows queries
                    return { data: [
                        { type: 'Customer Payments', amount: 5000 },
                        { type: 'Bank Deposits', amount: 1000 }
                    ], loading: false };
                }
                if (sql.includes('\'Vendor Payments\' as type')) {
                    // Outflows queries
                    return { data: [
                        { type: 'Vendor Payments', amount: 2000 },
                        { type: 'Expenses', amount: 500 }
                    ], loading: false };
                }
                return { data: [], loading: false };
            });

            const { result } = renderHook(() => useCashFlowReport(mockDateRange));

            // Total In: 6000
            // Total Out: 2500
            // Net: 3500
            
            const data = result.current.data;
            expect(data?.inflows.total).toBe(6000);
            expect(data?.outflows.total).toBe(2500);
            expect(data?.netCashFlow).toBe(3500);
        });
    });
});
