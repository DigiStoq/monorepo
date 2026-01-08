import React, { useState } from "react";
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
import { wp, hp } from "../../lib/responsive";

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

  const { data: purchaseOrders, isLoading } = useQuery<PurchaseOrder>(`
        SELECT * FROM purchase_orders 
        ORDER BY date DESC, created_at DESC
    `);

  const filteredOrders = purchaseOrders.filter(
    (order) =>
      order.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.po_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const renderItem = ({ item }: { item: PurchaseOrder }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate("PurchaseOrderForm", { id: item.id } as any);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.info}>
          <Text style={styles.poNumber}>{item.po_number || "Draft PO"}</Text>
          <Text style={styles.supplierName}>{item.supplier_name}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status).bg },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status).text },
            ]}
          >
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            navigation.navigate("PurchaseOrderForm" as any);
          }}
        >
          <Plus color="#ffffff" size={24} />
        </TouchableOpacity>
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
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <ClipboardList size={48} color="#cbd5e1" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No purchase orders found</Text>
              <Text style={styles.emptySubtext}>
                Create a new order to send to suppliers
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function getStatusColor(status: string = 'draft') {
  switch (status.toLowerCase()) {
    case "sent":
      return { bg: "#dbeafe", text: "#1e40af" };
    case "received":
      return { bg: "#dcfce7", text: "#166534" };
    case "cancelled":
      return { bg: "#f1f5f9", text: "#475569" };
    case "draft":
    default:
      return { bg: "#f3f4f6", text: "#374151" };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    padding: wp(4),
    gap: wp(3),
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: wp(3),
    fontSize: 16,
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    height: hp(6),
  },
  addButton: {
    width: hp(6),
    height: hp(6),
    backgroundColor: "#6366f1",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  list: { padding: wp(4), paddingTop: 0, gap: hp(1.5) },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: wp(4),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  info: { flex: 1 },
  poNumber: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  supplierName: { fontSize: 14, color: "#64748b", marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: hp(2),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  dateInfo: {},
  dateLabel: { fontSize: 12, color: "#64748b" },
  dateValue: { fontSize: 14, color: "#0f172a", marginTop: 2 },
  amountInfo: { alignItems: "flex-end" },
  totalLabel: { fontSize: 12, color: "#64748b" },
  totalValue: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  empty: { alignItems: "center", paddingVertical: hp(8) },
  emptyIcon: { marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#0f172a" },
  emptySubtext: { fontSize: 14, color: "#64748b", marginTop: 4 },
});
