import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { useQuery } from "@powersync/react-native";
import { useNavigation } from "@react-navigation/native";
import { Plus, Search, Filter, ChevronRight, CreditCard } from "lucide-react-native";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

// Types
interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  date: string;
  total: number;
  status: string;
  amount_due: number;
}

function PurchaseInvoiceCard({ item }: { item: PurchaseInvoice }) {
  const navigation = useNavigation();
  
  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: colors.surfaceHover, text: colors.textSecondary },
    unpaid: { bg: colors.dangerMuted, text: colors.danger },
    paid: { bg: colors.successMuted, text: colors.success },
    partial: { bg: colors.warningMuted, text: colors.warning },
    overdue: { bg: colors.dangerMuted, text: colors.danger },
  };

  const statusStyle = statusColors[item.status?.toLowerCase()] || statusColors.draft;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        (navigation as any).navigate("PurchaseInvoiceForm", { id: item.id });
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <CreditCard size={22} color={colors.accent} />
        </View>
        <View style={styles.info}>
          <View style={styles.billHeaderRow}>
            <Text style={styles.billNumber}>{item.invoice_number || "Draft"}</Text>
            <Text style={styles.totalValue}>
              ${item.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <Text style={styles.vendorName}>{item.customer_name || "Unknown Supplier"}</Text>
          <View style={styles.billFooterRow}>
            <Text style={styles.dateValue}>{formatDate(item.date)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
               <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function PurchaseInvoicesScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: invoices, isLoading } = useQuery<PurchaseInvoice>(`
        SELECT * FROM purchase_invoices 
        ORDER BY date DESC, created_at DESC
    `);

  const filteredInvoices = (invoices || []).filter(
    (inv) =>
      inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchText}
            placeholder="Search bills..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredInvoices}
        renderItem={({ item }) => <PurchaseInvoiceCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconContainer}>
                <CreditCard size={48} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyText}>No bills found</Text>
              <Text style={styles.emptySubtext}>
                Record your purchases and keep track of your expenses.
              </Text>
              <TouchableOpacity 
                style={styles.emptyAddButton}
                onPress={() => (navigation as any).navigate("PurchaseInvoiceForm")}
              >
                <Text style={styles.emptyAddButtonText}>Add New Bill</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => (navigation as any).navigate("PurchaseInvoiceForm")}
      >
        <Plus size={24} color={colors.textOnAccent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  billHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  billNumber: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  vendorName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  billFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateValue: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.md,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: spacing.xl,
  },
  emptyAddButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  emptyAddButtonText: {
    color: colors.accent,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  }
});
