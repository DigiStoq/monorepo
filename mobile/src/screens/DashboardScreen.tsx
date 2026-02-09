import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@powersync/react-native";
import { SyncStatus } from "../components/SyncStatus";

import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  Package,
  Bell,
  MessageCircle,
  TrendingUp,
  Box,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
} from "lucide-react-native";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../lib/theme";

const { width } = Dimensions.get("window");

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [refreshing, setRefreshing] = React.useState(false);

  // Fetch stats - matching the original queries
  const { data: customerCount } = useQuery<{ count: number }>("SELECT COUNT(*) as count FROM customers");
  const { data: itemCount } = useQuery<{ count: number }>("SELECT COUNT(*) as count FROM items");
  // Out of stock logic? Assuming quantity = 0
  const { data: outOfStockCount } = useQuery<{ count: number }>("SELECT COUNT(*) as count FROM items WHERE stock_quantity <= 0");
  const { data: lowStockCount } = useQuery<{ count: number }>("SELECT COUNT(*) as count FROM items WHERE stock_quantity > 0 AND stock_quantity < 10"); // Arbitrary low stock threshold
  const { data: totalSales } = useQuery<{ sum: number }>("SELECT COALESCE(SUM(total), 0) as sum FROM sale_invoices WHERE status != 'cancelled'");

  // Sales Trend Data (Last 5 days)
  const { data: recentSales } = useQuery<{ date: string; total: number }>(`
    SELECT date(created_at) as date, SUM(total) as total 
    FROM sale_invoices 
    WHERE status != 'cancelled' 
    GROUP BY date(created_at) 
    ORDER BY date(created_at) DESC 
    LIMIT 5
  `);

  // Transform query data for chart
  const chartData = React.useMemo(() => {
    const data = [...(recentSales || [])].reverse();
    // If empty, return a placeholder or empty
    if (data.length === 0) return [0, 0, 0, 0, 0];
    return data.map(d => d.total);
  }, [recentSales]);

  // Generate labels (Mon, Tue etc) based on the dates
  const chartLabels = React.useMemo(() => {
    const data = [...(recentSales || [])].reverse();
    if (data.length === 0) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
  }, [recentSales]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Refresh logic here if needed, or just re-run queries
    // Since useQuery subscribes, often just a simulated wait is enough or re-fetching remote if supported
    // For now, simple timeout or no-op
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* ... user avatar ... */}
            <View>
              <Text style={styles.greeting}>GOOD MORNING! ^-^</Text>
              <Text style={styles.username}>{user?.email?.split('@')[0] || "User"}</Text>
              <SyncStatus />
            </View>
          </View>
          {/* ... right side ... */}
          <TouchableOpacity style={styles.chatButton}>
            <Text style={styles.chatButtonText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color={colors.text} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.grid}>
          {/* Main Card - Total Stock Value */}
          <View style={[styles.card, styles.primaryCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainerPrimary}>
                <TrendingUp size={20} color={colors.textOnPrimary} />
              </View>
              <View style={styles.pillPrimary}>
                <Text style={styles.pillTextPrimary}>Weekly</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.primaryValue}>{formatCurrency(totalSales?.[0]?.sum || 0)}</Text>
              <Text style={styles.primaryLabel}>Total Sales Value</Text>
            </View>
            <View style={styles.cardFooter}>
              <ArrowUpRight size={16} color={colors.textOnPrimary} />
            </View>
          </View>

          {/* Total Stock */}
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => (navigation as any).navigate("ItemsTab", { filter: 'all' })}
              style={{ flex: 1, justifyContent: 'space-between' }}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
                  <Box size={20} color={colors.success} />
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Weekly</Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.value}>{itemCount?.[0]?.count || 0}</Text>
                <Text style={styles.label}>Total Stock</Text>
              </View>
              <View style={styles.cardFooter}>
                <ArrowUpRight size={16} color={colors.text} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Out of Stock */}
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => (navigation as any).navigate("ItemsTab", { filter: 'out' })}
              style={{ flex: 1, justifyContent: 'space-between' }}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: colors.danger + '20' }]}>
                  <XCircle size={20} color={colors.danger} />
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Weekly</Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.value}>{outOfStockCount?.[0]?.count || 0}</Text>
                <Text style={styles.label}>Out of Stock</Text>
              </View>
              <View style={styles.cardFooter}>
                <ArrowUpRight size={16} color={colors.text} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Low Stock */}
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => (navigation as any).navigate("ItemsTab", { filter: 'low' })}
              style={{ flex: 1, justifyContent: 'space-between' }}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
                  <AlertTriangle size={20} color={colors.warning} />
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Weekly</Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.value}>{lowStockCount?.[0]?.count || 0}</Text>
                <Text style={styles.label}>Low Stock</Text>
              </View>
              <View style={styles.cardFooter}>
                <ArrowUpRight size={16} color={colors.text} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sales Trend Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Sales Trend</Text>
              <Text style={styles.chartSubtitle}>
                Last 5 Days Revenue
              </Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Last 5 days</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            {chartData.map((value, index) => {
              // Calculate height percentage relative to max value
              const max = Math.max(...chartData, 1); // Avoid div by 0
              const heightPercent = (value / max) * 100;
              return (
                <View key={index} style={styles.barColumn}>
                  <Text style={styles.barLabel}>{value > 0 ? (value > 999 ? (value / 1000).toFixed(1) + 'k' : value) : ''}</Text>
                  <View style={styles.barBackground}>
                    <View style={[
                      styles.barFill,
                      {
                        height: `${heightPercent}%`,
                        backgroundColor: index === chartData.length - 1 ? colors.primary : colors.primaryLight
                      }
                    ]}
                    />
                  </View>
                  <Text style={styles.dayLabel}>{chartLabels[index]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView >
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceActive,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  greeting: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  username: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chatButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  chatButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    width: (width - (spacing.lg * 2) - spacing.md) / 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
    height: 160,
    justifyContent: 'space-between'
  },
  primaryCard: {
    backgroundColor: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerPrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pill: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillPrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  pillTextPrimary: {
    fontSize: 10,
    color: colors.textOnPrimary,
  },
  cardContent: {
    marginTop: spacing.sm,
  },
  primaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  primaryLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  chartTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
  },
  barColumn: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  barBackground: {
    width: 40,
    height: 150,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  barStack: {
    width: '100%',
    borderRadius: 8,
    position: 'absolute',
    zIndex: 1,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: -4,
  },
  dayLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
});
