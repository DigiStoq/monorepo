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
  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: "rgba(100, 116, 139, 0.2)", text: "#64748b" },
    sent: { bg: "rgba(59, 130, 246, 0.2)", text: "#3b82f6" },
    paid: { bg: "rgba(34, 197, 94, 0.2)", text: "#22c55e" },
    partial: { bg: "rgba(245, 158, 11, 0.2)", text: "#f59e0b" },
    overdue: { bg: "rgba(239, 68, 68, 0.2)", text: "#ef4444" },
    cancelled: { bg: "rgba(239, 68, 68, 0.2)", text: "#ef4444" },
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
      <View style={styles.cardHeader}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          <Text style={styles.customerName}>{invoice.customer_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {invoice.status}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.dateInfo}>
          <Text style={styles.dateLabel}>Date</Text>
          <Text style={styles.dateValue}>{formatDate(invoice.date)}</Text>
        </View>
        <View style={styles.amountInfo}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            ${invoice.total?.toFixed(2) || "0.00"}
          </Text>
          {invoice.amount_due > 0 && invoice.status !== "paid" && (
            <Text style={styles.dueAmount}>
              Due: ${invoice.amount_due?.toFixed(2)}
            </Text>
          )}
        </View>
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
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoices..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => (navigation as any).navigate("SaleInvoiceForm")}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={invoices || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InvoiceCard invoice={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>No invoices found</Text>
            <Text style={styles.emptySubtext}>
              Create your first invoice to get started
            </Text>
          </View>
        }
      />
    </View>
  );
}

import { wp, hp } from "../lib/responsive";

// ...

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
  addButtonText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
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
    fontSize: 48,
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
