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

export function DashboardPage() {
  // Data from PowerSync
  const { metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { transactions, isLoading: transactionsLoading } =
    useRecentTransactions(10);
  const { chartData, isLoading: chartLoading } = useSalesChartData(7);

  const handleQuickAction = (actionId: string) => {
    console.log("Quick action:", actionId);
    // Handle navigation/modal opening based on actionId
  };

  const handleTransactionClick = (transaction: Transaction) => {
    console.log("Transaction clicked:", transaction);
    // Navigate to transaction detail
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
          console.log("View all transactions");
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
