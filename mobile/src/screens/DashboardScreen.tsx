import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CustomHeader } from "../components/CustomHeader";
import { SyncStatus } from "../components/SyncStatus";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getProfColors } from "../lib/theme";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  BoxIcon,
  AlertTriangleIcon,
  XCircleIcon,
  DollarSignIcon,
  ReceiptIcon,
  FileTextIcon,
  CheckCircleIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon
} from "../components/ui/UntitledIcons";
import type {
  DashboardTransaction
} from "../hooks/useDashboard";
import {
  useDashboardMetrics,
  useStockMetrics,
  useSalesChartData,
  useRecentTransactions
} from "../hooks/useDashboard";

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  // Hooks
  const { metrics } = useDashboardMetrics();
  const { metrics: stockMetrics } = useStockMetrics();
  const { chartData } = useSalesChartData(7);
  const { transactions } = useRecentTransactions(5);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); }, 1000);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Professional Palette Constants (dark-mode-aware)
  const profColors = getProfColors(isDark);

  const getTransactionIcon = (type: DashboardTransaction['type']) => {
    switch (type) {
      case 'sale': return <ReceiptIcon size={20} color={profColors.sales.icon} strokeWidth={2} />;
      case 'purchase': return <FileTextIcon size={20} color={profColors.payable.icon} strokeWidth={2} />;
      case 'payment-in': return <CheckCircleIcon size={20} color={profColors.receivable.icon} strokeWidth={2} />;
      case 'payment-out': return <TrendingDownIcon size={20} color={profColors.payable.icon} strokeWidth={2} />;
      default: return <DollarSignIcon size={20} color={colors.text} />;
    }
  };


  return (
    <View className="flex-1 bg-background">
      <CustomHeader title="Dashboard" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Content */}
        <View className="flex-row justify-between items-start mb-4 mt-1">
          <View>
            <Text className="text-xs text-text-muted font-bold tracking-widest">GOOD MORNING!</Text>
            <Text className="text-2xl font-bold text-text">{user?.email?.split('@')[0] || "User"}</Text>
          </View>
          <SyncStatus />
        </View>

        {/* Financial Summary */}
        <Text className="text-lg font-bold text-text mb-3">Financial Overview</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 16 }}
        >
          {/* Receivable */}
          <View className="w-40 p-3 rounded-2xl mb-1 shadow-sm bg-surface">
            <View className="flex-row justify-between items-start mb-3">
              <View
                className="w-10 h-10 justify-center items-center"
              >
                <TrendingUpIcon size={24} color={profColors.receivable.icon} strokeWidth={2} />
              </View>
              <View
                className="flex-row items-center px-1.5 py-0.5 rounded-lg gap-0.5"
                style={{ backgroundColor: metrics.receivableChange >= 0 ? profColors.receivable.bg : profColors.payable.bg }}
              >
                {metrics.receivableChange >= 0 ?
                  <ArrowUpRightIcon size={12} color={profColors.receivable.icon} /> :
                  <ArrowDownRightIcon size={12} color={profColors.payable.icon} />
                }
                <Text
                  className="text-[10px] font-bold"
                  style={{ color: metrics.receivableChange >= 0 ? profColors.receivable.icon : profColors.payable.icon }}
                >
                  {Math.abs(metrics.receivableChange).toFixed(1)}%
                </Text>
              </View>
            </View>
            <Text className="text-xl font-bold text-text mb-0.5">{formatCurrency(metrics.totalReceivable)}</Text>
            <Text className="text-xs text-text-muted">To Receive</Text>
          </View>

          {/* Payable */}
          <View className="w-40 p-3 rounded-2xl mb-1 shadow-sm bg-surface">
            <View className="flex-row justify-between items-start mb-3">
              <View
                className="w-10 h-10 justify-center items-center"
              >
                <TrendingDownIcon size={24} color={profColors.payable.icon} strokeWidth={2} />
              </View>
              <View
                className="flex-row items-center px-1.5 py-0.5 rounded-lg gap-0.5"
                style={{ backgroundColor: metrics.payableChange >= 0 ? profColors.payable.bg : profColors.receivable.bg }}
              >
                <ArrowUpRightIcon size={12} color={profColors.payable.icon} />
                <Text
                  className="text-[10px] font-bold"
                  style={{ color: profColors.payable.icon }}
                >
                  {Math.abs(metrics.payableChange).toFixed(1)}%
                </Text>
              </View>
            </View>
            <Text className="text-xl font-bold text-text mb-0.5">{formatCurrency(metrics.totalPayable)}</Text>
            <Text className="text-xs text-text-muted">To Pay</Text>
          </View>

          {/* Sales Today */}
          <View className="w-40 p-3 rounded-2xl mb-1 shadow-sm bg-surface">
            <View className="flex-row justify-between items-start mb-3">
              <View
                className="w-10 h-10 justify-center items-center"
              >
                <ReceiptIcon size={24} color={colors.info} strokeWidth={2.5} />
              </View>
            </View>
            <Text className="text-xl font-bold text-text mb-0.5">{formatCurrency(metrics.todaySales)}</Text>
            <Text className="text-xs text-text-muted">Sales Today</Text>
          </View>
        </ScrollView>

        {/* Stock Overview */}
        <Text className="text-lg font-bold text-text mb-3 mt-5">Inventory Status</Text>
        <View className="flex-row gap-3">
          {/* Total Items */}
          <View className="flex-1 bg-surface rounded-2xl p-3 items-center shadow-sm">
            <TouchableOpacity className="items-center" onPress={() => navigation.navigate("ItemsTab", { filter: 'all' })}>
              <View
                className="w-11 h-11 justify-center items-center mb-2"
              >
                <BoxIcon size={28} color={colors.primary} strokeWidth={2} />
              </View>
              <Text className="text-lg font-bold text-text">{stockMetrics.itemCount}</Text>
              <Text className="text-xs text-text-muted text-center mt-0.5">Total Items</Text>
            </TouchableOpacity>
          </View>

          {/* Low Stock */}
          <View className="flex-1 bg-surface rounded-2xl p-3 items-center shadow-sm">
            <TouchableOpacity className="items-center" onPress={() => navigation.navigate("ItemsTab", { filter: 'low' })}>
              <View
                className="w-11 h-11 justify-center items-center mb-2"
              >
                <AlertTriangleIcon size={28} color={colors.warning} strokeWidth={2} />
              </View>
              <Text className="text-lg font-bold text-text">{stockMetrics.lowStockCount}</Text>
              <Text className="text-xs text-text-muted text-center mt-0.5">Low Stock</Text>
            </TouchableOpacity>
          </View>

          {/* Out of Stock */}
          <View className="flex-1 bg-surface rounded-2xl p-3 items-center shadow-sm">
            <TouchableOpacity className="items-center" onPress={() => navigation.navigate("ItemsTab", { filter: 'out' })}>
              <View
                className="w-11 h-11 justify-center items-center mb-2"
              >
                <XCircleIcon size={28} color={colors.danger} strokeWidth={2} />
              </View>
              <Text className="text-lg font-bold text-text">{stockMetrics.outOfStockCount}</Text>
              <Text className="text-xs text-text-muted text-center mt-0.5">Out of Stock</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        <View className="bg-surface rounded-xl p-4 shadow-sm mt-6">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-base font-bold text-text">Revenue vs Purchases</Text>
              <Text className="text-xs text-text-muted">Last 7 Days</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-end h-[150px]">
            {chartData.map((data, index) => {
              const maxVal = Math.max(...chartData.map(d => Math.max(d.sales, d.purchases)), 100);
              const salesHeight = (data.sales / maxVal) * 100;
              const purchaseHeight = (data.purchases / maxVal) * 100;

              return (
                <View key={index} className="items-center gap-2 flex-1">
                  <View className="w-5 h-[120px] justify-end items-center">
                    <View className="flex-row items-end h-full gap-0.5">
                      <View
                        className="rounded-[3px] w-1.5 opacity-60"
                        style={{ height: `${purchaseHeight}%`, backgroundColor: colors.danger }}
                      />
                      <View
                        className="rounded-[3px] w-1.5"
                        style={{ height: `${salesHeight}%`, backgroundColor: colors.success }}
                      />
                    </View>
                  </View>
                  <Text className="text-[10px] text-text-muted">{data.date}</Text>
                </View>
              );
            })}
          </View>
          <View className="flex-row justify-center gap-4 mt-3">
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.success }} />
              <Text className="text-xs text-text-secondary">Sales</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: colors.danger }} />
              <Text className="text-xs text-text-secondary">Purchases</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View className="flex-row justify-between items-center mt-6 mb-3">
          <Text className="text-lg font-bold text-text">Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate("SalesTab")}>
            <Text className="text-sm text-primary font-medium">See All</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-surface rounded-xl shadow-sm p-1">
          {transactions.map((tx) => {
            return (
              <TouchableOpacity key={tx.id} className="flex-row items-center p-3 border-b border-border-light last:border-b-0">
                <View
                  className="w-10 h-10 justify-center items-center"
                >
                  {getTransactionIcon(tx.type)}
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-semibold text-text">{tx.name || 'Unknown'}</Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} • {tx.invoiceNumber || '-'}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className="text-sm font-bold"
                    style={{
                      color: tx.type === 'sale' || tx.type === 'payment-in' ? profColors.receivable.icon : colors.text
                    }}
                  >
                    {tx.type === 'sale' || tx.type === 'payment-in' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </Text>
                  <Text className="text-[10px] text-text-muted mt-0.5">{tx.date}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {transactions.length === 0 && (
            <View className="p-4 items-center">
              <Text className="text-text-muted text-sm">No recent activity</Text>
            </View>
          )}
        </View>

        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
