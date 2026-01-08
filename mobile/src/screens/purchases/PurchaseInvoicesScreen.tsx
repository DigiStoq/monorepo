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
import { Plus, Search, FileText, Filter, ChevronRight, CreditCard } from "lucide-react-native";
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

function PurchaseInvoiceCard({ item }: { item: PurchaseInvoice }) {
  const navigation = useNavigation();
  
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: "#f1f5f9", text: "#64748b", border: "#e2e8f0" },
    unpaid: { bg: "#fef2f2", text: "#ef4444", border: "#fee2e2" },
    paid: { bg: "#f0fdf4", text: "#22c55e", border: "#dcfce7" },
    partial: { bg: "#fffbeb", text: "#f59e0b", border: "#fef3c7" },
    overdue: { bg: "#fef2f2", text: "#ef4444", border: "#fee2e2" },
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
      <View style={styles.cardMain}>
        <View style={styles.billIconBox}>
          <CreditCard size={20} color="#ef4444" />
        </View>
        <View style={styles.billMainInfo}>
          <View style={styles.billHeaderRow}>
            <Text style={styles.billNumber}>{item.invoice_number || "Draft"}</Text>
            <Text style={styles.totalValue}>
              ${item.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <Text style={styles.vendorName}>{item.customer_name || "Unknown Supplier"}</Text>
          <View style={styles.billFooterRow}>
            <Text style={styles.dateValue}>{formatDate(item.date)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
               <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>
        <ChevronRight size={18} color="#cbd5e1" style={{ marginLeft: 8 }} />
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bills..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#64748b" />
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
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconContainer}>
                <CreditCard size={48} color="#cbd5e1" />
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
        <Plus size={24} color="#fff" strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    alignItems: "center",
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff1f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billMainInfo: {
    flex: 1,
  },
  billHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  billNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ef4444",
  },
  vendorName: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  billFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateValue: {
    fontSize: 12,
    color: "#94a3b8",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748b",
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddButtonText: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 15,
  }
});
