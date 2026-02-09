import React, { useState, useCallback, useMemo } from "react";
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
import { Plus, Search, ClipboardList } from "lucide-react-native";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../../lib/theme";
import { useTheme } from "../../contexts/ThemeContext";

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  date: string;
  total: number;
  status: string;
  expected_date?: string;
}

export function PurchaseOrdersScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: purchaseOrders, isLoading } = useQuery<PurchaseOrder>(`
        SELECT * FROM purchase_orders 
        ORDER BY date DESC, created_at DESC
    `);

  const filteredOrders = (purchaseOrders || []).filter(
    (order) =>
      order.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.po_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string = 'draft') => {
    switch (status.toLowerCase()) {
      case "sent":
        return { bg: colors.info + '20', text: colors.info };
      case "received":
        return { bg: colors.success + '20', text: colors.success };
      case "cancelled":
        return { bg: colors.surfaceHover, text: colors.textSecondary };
      case "draft":
      default:
        return { bg: colors.surfaceHover, text: colors.textSecondary };
    }
  };

  const renderItem = ({ item }: { item: PurchaseOrder }) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          navigation.navigate("PurchaseOrderForm" as any, { id: item.id });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <ClipboardList size={22} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.poNumber}>{item.po_number || "Draft PO"}</Text>
            <Text style={styles.supplierName}>{item.supplier_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Date</Text>
            <Text style={styles.dateValue}>{item.date}</Text>
          </View>
          <View style={styles.amountInfo}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${item.total?.toFixed(2) || "0.00"}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchText}
            placeholder="Search orders..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <ClipboardList size={48} color={colors.textMuted} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No purchase orders found</Text>
              <Text style={styles.emptySubtext}>
                Create a new order to send to suppliers
              </Text>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => (navigation as any).navigate("PurchaseOrderForm")}
      >
        <Plus size={24} color={"#ffffff"} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
  },
  searchText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  list: { padding: spacing.xl, paddingTop: 0, paddingBottom: 100, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1 },
  poNumber: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  supplierName: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: "capitalize" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight, // Using borderLight from theme if available or border
  },
  dateInfo: {},
  dateLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  dateValue: { fontSize: fontSize.sm, color: colors.text, marginTop: 2 },
  amountInfo: { alignItems: "flex-end" },
  totalLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  totalValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  empty: { alignItems: "center", paddingVertical: 80 },
  emptyIcon: { marginBottom: spacing.md },
  emptyText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.md,
  },
});
