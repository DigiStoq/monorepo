import React from "react";
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
import { 
  Package, 
  ShoppingCart,
  BarChart3,
  Users,
  ChevronRight,
  FileText,
  TrendingUp,
  DollarSign,
} from "lucide-react-native";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../lib/theme";

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // Fetch stats
  const { data: customerCount } = useQuery<{ count: number }>("SELECT COUNT(*) as count FROM customers");
  const { data: itemCount } = useQuery<{ count: number }>("SELECT COUNT(*) as count FROM items");
  const { data: invoiceCount } = useQuery<{ count: number }>("SELECT COUNT(*) as count FROM sale_invoices");
  const { data: totalSales } = useQuery<{ sum: number }>("SELECT COALESCE(SUM(total), 0) as sum FROM sale_invoices WHERE status != 'cancelled'");

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

  const MenuCard = ({ icon: Icon, title, subtitle, onPress }: { icon: any; title: string; subtitle?: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuCardIcon}>
        <Icon size={24} color={colors.accent} strokeWidth={2} />
      </View>
      <View style={styles.menuCardContent}>
        <Text style={styles.menuCardTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuCardSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.successMuted }]}>
            <DollarSign size={20} color={colors.success} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(totalSales?.[0]?.sum || 0)}</Text>
          <Text style={styles.statLabel}>Total Sales</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.infoMuted }]}>
            <FileText size={20} color={colors.info} />
          </View>
          <Text style={styles.statValue}>{invoiceCount?.[0]?.count || 0}</Text>
          <Text style={styles.statLabel}>Invoices</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.warningMuted }]}>
            <Users size={20} color={colors.warning} />
          </View>
          <Text style={styles.statValue}>{customerCount?.[0]?.count || 0}</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.dangerMuted }]}>
            <Package size={20} color={colors.danger} />
          </View>
          <Text style={styles.statValue}>{itemCount?.[0]?.count || 0}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
      </View>

      {/* Quick Actions Section */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <View style={styles.menuSection}>
        <MenuCard 
          icon={Package} 
          title="Inventory" 
          subtitle="Manage your products"
          onPress={() => navigation.navigate("ItemsTab")}
        />
        <MenuCard 
          icon={ShoppingCart} 
          title="Sales" 
          subtitle="View orders & invoices"
          onPress={() => navigation.navigate("SalesTab")}
        />
        <MenuCard 
          icon={BarChart3} 
          title="Reports" 
          subtitle="Analytics & insights"
          onPress={() => navigation.navigate("ReportsTab")}
        />
        <MenuCard 
          icon={Users} 
          title="Customers" 
          subtitle="Manage contacts"
          onPress={() => navigation.navigate("Customers")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  menuSection: {
    gap: spacing.sm,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  menuCardIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuCardContent: {
    flex: 1,
  },
  menuCardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  menuCardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
});
