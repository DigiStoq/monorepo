import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@powersync/react-native";
import { Search, Plus, Filter, FileText, ChevronRight } from "lucide-react-native";
import { wp, hp } from "../lib/responsive";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  date: string;
  due_date: string;
  status: string;
  total: number;
  amount_due: number;
}

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const navigation = useNavigation();
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: "#f1f5f9", text: "#64748b", border: "#e2e8f0" },
    sent: { bg: "#eff6ff", text: "#3b82f6", border: "#dbeafe" },
    paid: { bg: "#f0fdf4", text: "#22c55e", border: "#dcfce7" },
    partial: { bg: "#fffbeb", text: "#f59e0b", border: "#fef3c7" },
    overdue: { bg: "#fef2f2", text: "#ef4444", border: "#fee2e2" },
    cancelled: { bg: "#f8fafc", text: "#94a3b8", border: "#f1f5f9" },
  };

  const statusStyle = statusColors[invoice.status] || statusColors.draft;

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
      onPress={() =>
        (navigation as any).navigate("SaleInvoiceForm", { id: invoice.id })
      }
    >
      <View style={styles.cardMain}>
        <View style={styles.invoiceIconBox}>
          <FileText size={20} color="#6366f1" />
        </View>
        <View style={styles.invoiceMainInfo}>
          <View style={styles.invoiceHeaderRow}>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.totalValue}>
              ${invoice.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <Text style={styles.customerName}>{invoice.customer_name || "Unknown Customer"}</Text>
          <View style={styles.invoiceFooterRow}>
            <Text style={styles.dateValue}>{formatDate(invoice.date)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
               <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {invoice.status}
              </Text>
            </View>
          </View>
        </View>
        <ChevronRight size={18} color="#cbd5e1" style={{ marginLeft: 8 }} />
      </View>
    </TouchableOpacity>
  );
}

export function SalesScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: invoices, isLoading } = useQuery<Invoice>(
    `SELECT * FROM sale_invoices 
     WHERE ($1 IS NULL OR invoice_number LIKE $1 OR customer_name LIKE $1) 
     ORDER BY date DESC`,
    [search ? `%${search}%` : null]
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoices..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={invoices || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InvoiceCard invoice={item} />}
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
          <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
               <FileText size={48} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyText}>No invoices found</Text>
            <Text style={styles.emptySubtext}>
              Once you create an invoice, it will appear here.
            </Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={() => (navigation as any).navigate("SaleInvoiceForm")}
            >
              <Text style={styles.emptyAddButtonText}>Create New Invoice</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => (navigation as any).navigate("SaleInvoiceForm")}
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
  invoiceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  invoiceMainInfo: {
    flex: 1,
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#6366f1",
  },
  customerName: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  invoiceFooterRow: {
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
