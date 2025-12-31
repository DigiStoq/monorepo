import { useNavigate } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout";
import { PageHeader } from "@/components/layout";
import {
  MetricCards,
  SalesChart,
  QuickActions,
  RecentTransactions,
  FloatingActionButton,
  type Transaction,
} from "./components";
import {
  useDashboardMetrics,
  useRecentTransactions,
  useSalesChartData,
} from "@/hooks/useDashboard";

export function DashboardPage(): React.ReactNode {
  const navigate = useNavigate();
  // Data from PowerSync
  const { metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { transactions, isLoading: transactionsLoading } =
    useRecentTransactions(10);
  const { chartData, isLoading: chartLoading } = useSalesChartData(7);

  const handleQuickAction = (actionId: string): void => {
    const routes: Record<string, string> = {
      "add-sale": "/sale/invoices",
      "add-purchase": "/purchase/invoices",
      "add-item": "/items",
      "add-customer": "/customers",
      "payment-in": "/sale/payment-in",
      "payment-out": "/purchase/payment-out",
    };

    const route = routes[actionId];
    if (route) {
      void navigate({ to: route });
    }
  };

  const handleTransactionClick = (_transaction: Transaction): void => {
    // TODO: Navigate to transaction detail
  };

  return (
    <PageContainer padding="lg" maxWidth="2xl">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Overview of your business performance"
        className="mb-6 -mx-8 -mt-8 px-8 pt-6"
      />

      {/* Metrics */}
      <MetricCards
        metrics={metrics}
        isLoading={metricsLoading}
        className="mb-6"
      />

      {/* Charts and Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <SalesChart
          data={chartData}
          isLoading={chartLoading}
          className="lg:col-span-2"
        />
        <QuickActions onAction={handleQuickAction} />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions
        transactions={transactions as Transaction[]}
        isLoading={transactionsLoading}
        onViewAll={() => {
          void navigate({ to: "/sale/invoices" });
        }}
        onTransactionClick={handleTransactionClick}
      />

      {/* Floating Action Button (Mobile) */}
      <FloatingActionButton
        onClick={() => {
          handleQuickAction("add-sale");
        }}
        className="lg:hidden"
      />
    </PageContainer>
  );
}
