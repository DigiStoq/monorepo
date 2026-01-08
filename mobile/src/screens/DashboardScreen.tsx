import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@powersync/react-native";
import { getPowerSyncDatabase } from "../lib/powersync";
import { useAuth } from "../contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  DollarSign, 
  FileText, 
  Users, 
  Package, 
  Plus,
  TrendingUp,
  ChevronRight,
  Bell,
} from "lucide-react-native";
import { SegmentedControl } from "../components/SegmentedControl";
import { SyncStatus } from "../components/SyncStatus";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../lib/theme";

export function DashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Business Owner";
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch stats
  const { data: customerCount } = useQuery<{ count: number }>("SELECT COUNT(*) as count FROM customers");
  const { data: itemCount } = useQuery<{ count: number }>("SELECT COUNT(*) as count FROM items");
  const { data: invoiceCount } = useQuery<{ count: number }>("SELECT COUNT(*) as count FROM sale_invoices");
  const { data: totalSales } = useQuery<{ sum: number }>("SELECT COALESCE(SUM(total), 0) as sum FROM sale_invoices WHERE status != 'cancelled'");
  
  // Recent Activity
  const { data: recentSales } = useQuery<{
    id: string;
    customer_name: string;
    total: number;
    created_at: string;
    status: string;
  }>(`SELECT id, customer_name, total, created_at, status FROM sale_invoices ORDER BY created_at DESC LIMIT 5`);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const db = getPowerSyncDatabase();
      await db.execute("SELECT 1"); 
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerTop}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>{displayName}</Text>
              <Text style={styles.subGreeting}>@digistoq</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <SyncStatus />
            <TouchableOpacity style={styles.notificationBtn}>
              <Bell size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentWrapper}>
          <SegmentedControl
            segments={[
              { label: "Overview", value: "overview" },
              { label: "Analytics", value: "analytics" },
            ]}
            activeValue={activeTab}
            onChange={setActiveTab}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* CTA Card */}
        <TouchableOpacity 
          style={styles.ctaCard}
          onPress={() => (navigation as any).navigate("SaleInvoiceForm")}
          activeOpacity={0.9}
        >
          <View style={styles.ctaContent}>
            <View style={styles.ctaIconBox}>
              <Plus size={20} color={colors.primary} strokeWidth={3} />
            </View>
            <View>
              <Text style={styles.ctaTitle}>Create New Invoice</Text>
              <Text style={styles.ctaSubtitle}>Start selling and grow your business</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Main Stats Card */}
        <View style={styles.mainStatCard}>
          <View style={styles.mainStatHeader}>
            <Text style={styles.mainStatTitle}>Total Revenue</Text>
            <View style={styles.trendBadge}>
              <TrendingUp size={14} color="#16a34a" />
              <Text style={styles.trendText}>+12.5%</Text>
            </View>
          </View>
          <Text style={styles.mainStatValue}>{formatCurrency(totalSales?.[0]?.sum || 0)}</Text>
          <Text style={styles.mainStatSub}>All time sales</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#dbeafe' }]}>
              <FileText size={20} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>{invoiceCount?.[0]?.count || 0}</Text>
            <Text style={styles.statLabel}>Invoices</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#dcfce7' }]}>
              <Users size={20} color="#16a34a" />
            </View>
            <Text style={styles.statValue}>{customerCount?.[0]?.count || 0}</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#fce7f3' }]}>
              <Package size={20} color="#db2777" />
            </View>
            <Text style={styles.statValue}>{itemCount?.[0]?.count || 0}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
          <TouchableOpacity style={styles.quickActionItem} onPress={() => (navigation as any).navigate("SaleInvoiceForm")}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryMuted }]}>
              <FileText size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickActionText}>New Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem} onPress={() => (navigation as any).navigate("CustomerForm")}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
              <Users size={24} color="#16a34a" />
            </View>
            <Text style={styles.quickActionText}>Add Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem} onPress={() => (navigation as any).navigate("ItemForm")}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
              <Package size={24} color="#d97706" />
            </View>
            <Text style={styles.quickActionText}>Add Item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem} onPress={() => (navigation as any).navigate("PaymentInForm")}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#fce7f3' }]}>
              <DollarSign size={24} color="#db2777" />
            </View>
            <Text style={styles.quickActionText}>Payment In</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Recent Activity */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Recent Invoices</Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('SalesTab')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentList}>
          {recentSales?.map((sale, index) => (
            <TouchableOpacity 
              key={sale.id} 
              style={[
                styles.recentItem, 
                index === (recentSales.length - 1) && { borderBottomWidth: 0 }
              ]} 
              onPress={() => (navigation as any).navigate('SaleInvoiceForm', { id: sale.id })}
            >
              <View style={styles.recentIcon}>
                <FileText size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{sale.customer_name || "Unknown"}</Text>
                <Text style={styles.recentDate}>{new Date(sale.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.recentAmountBox}>
                <Text style={styles.recentAmount}>{formatCurrency(sale.total)}</Text>
                <Text style={[styles.recentStatus, { color: sale.status === 'paid' ? '#16a34a' : '#f59e0b' }]}>
                  {sale.status}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
          {(!recentSales || recentSales.length === 0) && (
            <Text style={styles.emptyText}>No recent sales.</Text>
          )}
        </View>
        
        <View style={{ height: 40 }} /> 
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.surface,
  },
  greeting: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subGreeting: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentWrapper: {
    marginTop: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  content: { 
    padding: spacing.xl, 
    paddingTop: spacing.lg,
  },
  
  // CTA Card
  ctaCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    borderStyle: 'dashed',
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ctaIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  ctaSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Stats
  mainStatCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  mainStatHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: spacing.sm,
  },
  mainStatTitle: { 
    fontSize: fontSize.sm, 
    color: colors.textSecondary, 
    fontWeight: fontWeight.medium,
  },
  trendBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#dcfce7', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: borderRadius.full, 
    gap: 4,
  },
  trendText: { 
    fontSize: fontSize.xs, 
    color: '#16a34a', 
    fontWeight: fontWeight.semibold,
  },
  mainStatValue: { 
    fontSize: 32, 
    fontWeight: fontWeight.extrabold, 
    color: colors.text,
  },
  mainStatSub: { 
    fontSize: fontSize.xs, 
    color: colors.textMuted, 
    marginTop: 4,
  },

  statsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: spacing.xxxl,
  },
  statCard: { 
    width: '31%', 
    backgroundColor: colors.surface, 
    padding: spacing.md, 
    borderRadius: borderRadius.lg, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.borderLight,
  },
  statIconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: borderRadius.md, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: spacing.sm,
  },
  statValue: { 
    fontSize: fontSize.lg, 
    fontWeight: fontWeight.bold, 
    color: colors.text,
  },
  statLabel: { 
    fontSize: fontSize.xs, 
    color: colors.textSecondary,
  },

  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.md,
  },
  sectionTitle: { 
    fontSize: fontSize.lg, 
    fontWeight: fontWeight.bold, 
    color: colors.text,
  },
  seeAll: { 
    fontSize: fontSize.sm, 
    color: colors.primary, 
    fontWeight: fontWeight.semibold,
  },

  quickActionsScroll: { 
    flexDirection: 'row', 
    marginLeft: -spacing.xl, 
    paddingLeft: spacing.xl, 
    marginRight: -spacing.xl, 
    paddingRight: spacing.xl,
  }, 
  quickActionItem: { 
    marginRight: spacing.lg, 
    alignItems: 'center', 
    width: 80,
  },
  quickActionIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: borderRadius.xl, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: spacing.sm,
  },
  quickActionText: { 
    fontSize: fontSize.xs, 
    color: colors.textSecondary, 
    textAlign: 'center', 
    fontWeight: fontWeight.medium,
  },

  recentList: { 
    backgroundColor: colors.surface, 
    borderRadius: borderRadius.lg, 
    padding: 4, 
    borderWidth: 1, 
    borderColor: colors.borderLight,
  },
  recentItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: spacing.md, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.borderLight,
  },
  recentIcon: { 
    width: 40, 
    height: 40, 
    backgroundColor: colors.background, 
    borderRadius: borderRadius.sm, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: spacing.md,
  },
  recentInfo: { 
    flex: 1,
  },
  recentName: { 
    fontSize: fontSize.sm, 
    fontWeight: fontWeight.semibold, 
    color: colors.text,
  },
  recentDate: { 
    fontSize: fontSize.xs, 
    color: colors.textMuted,
  },
  recentAmountBox: { 
    alignItems: 'flex-end', 
    marginRight: spacing.sm,
  },
  recentAmount: { 
    fontSize: fontSize.sm, 
    fontWeight: fontWeight.bold, 
    color: colors.text,
  },
  recentStatus: { 
    fontSize: 10, 
    fontWeight: fontWeight.semibold, 
    textTransform: 'capitalize',
  },
  emptyText: { 
    padding: spacing.xl, 
    textAlign: 'center', 
    color: colors.textMuted,
  },
});
