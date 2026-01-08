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

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );
}

export function DashboardScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);

  // Fetch stats from local PowerSync database
  const { data: customerCount } = useQuery<{ count: number }>(
    "SELECT COUNT(*) as count FROM customers"
  );

  const { data: itemCount } = useQuery<{ count: number }>(
    "SELECT COUNT(*) as count FROM items"
  );

  const { data: invoiceCount } = useQuery<{ count: number }>(
    "SELECT COUNT(*) as count FROM sale_invoices"
  );

  const { data: totalSales } = useQuery<{ sum: number }>(
    "SELECT COALESCE(SUM(total), 0) as sum FROM sale_invoices WHERE status != 'cancelled'"
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // PowerSync auto-syncs, but we can trigger manual sync if needed
    try {
      const db = getPowerSyncDatabase();
      await db.execute("SELECT 1"); // Trigger any pending sync
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#6366f1"
        />
      }
    >
      <Text style={styles.greeting}>Dashboard</Text>
      <Text style={styles.subtitle}>Business overview</Text>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Sales"
          value={formatCurrency(totalSales?.[0]?.sum || 0)}
          icon="💰"
          color="#22c55e"
        />
        <StatCard
          title="Invoices"
          value={String(invoiceCount?.[0]?.count || 0)}
          icon="📄"
          color="#6366f1"
        />
        <StatCard
          title="Customers"
          value={String(customerCount?.[0]?.count || 0)}
          icon="👥"
          color="#f59e0b"
        />
        <StatCard
          title="Items"
          value={String(itemCount?.[0]?.count || 0)}
          icon="📦"
          color="#ec4899"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate("SaleInvoiceForm")}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>New Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate("CustomerForm")}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Add Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate("ItemForm")}
          >
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionText}>Add Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate("PaymentIn")}
          >
            <Text style={styles.actionIcon}>💵</Text>
            <Text style={styles.actionText}>Payment In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 24,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    gap: 16,
  },
  statIcon: {
    fontSize: 28,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  statTitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
  },
});
