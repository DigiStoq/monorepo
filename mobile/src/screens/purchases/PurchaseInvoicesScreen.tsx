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
import { Plus, Search, FileText, Filter } from "lucide-react-native";
import { wp, hp } from "../../lib/responsive";

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

export function PurchaseInvoicesScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: invoices, isLoading } = useQuery<PurchaseInvoice>(`
        SELECT * FROM purchase_invoices 
        ORDER BY date DESC, created_at DESC
    `);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // PowerSync is reactive, but we can simulate refresh or just wait
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const renderItem = ({ item }: { item: PurchaseInvoice }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate("PurchaseInvoiceForm", { id: item.id } as any);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>
            {item.invoice_number || "Draft"}
          </Text>
          <Text style={styles.customerName}>{item.customer_name}</Text>
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
          <Text style={styles.totalValue}>
            ${item.total?.toFixed(2) || "0.00"}
          </Text>
          {item.amount_due > 0 && (
            <Text style={styles.dueAmount}>
              Due: ${item.amount_due.toFixed(2)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search purchases..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            navigation.navigate("PurchaseInvoiceForm" as any);
          }}
        >
          <Plus color="#ffffff" size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredInvoices}
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
              <FileText size={48} color="#cbd5e1" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No purchase invoices found</Text>
              <Text style={styles.emptySubtext}>
                Create a new invoice to get started
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "paid":
      return { bg: "#dcfce7", text: "#166534" };
    case "partial":
      return { bg: "#fef9c3", text: "#854d0e" };
    case "overdue":
      return { bg: "#fee2e2", text: "#991b1b" };
    case "draft":
      return { bg: "#f1f5f9", text: "#475569" };
    default:
      return { bg: "#f3f4f6", text: "#374151" };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
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
  list: {
    padding: wp(4),
    paddingTop: 0,
    gap: hp(1.5),
  },
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
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  customerName: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
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
  dateLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  dateValue: {
    fontSize: 14,
    color: "#0f172a",
    marginTop: 2,
  },
  amountInfo: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  dueAmount: {
    fontSize: 12,
    color: "#f59e0b",
    marginTop: 2,
  },
  empty: {
    alignItems: "center",
    paddingVertical: hp(8),
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
});
