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
import { Search, Plus, Filter, FileText, ChevronRight, Calculator } from "lucide-react-native";
import { wp, hp } from "../../lib/responsive";

interface Estimate {
  id: string;
  estimate_number: string;
  customer_name: string;
  date: string;
  total: number;
  status: string; // 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
}

function EstimateCard({ estimate }: { estimate: Estimate }) {
  const navigation = useNavigation();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: "#f1f5f9", text: "#64748b", border: "#e2e8f0" },
    sent: { bg: "#eff6ff", text: "#3b82f6", border: "#dbeafe" },
    accepted: { bg: "#f0fdf4", text: "#22c55e", border: "#dcfce7" },
    rejected: { bg: "#fef2f2", text: "#ef4444", border: "#fee2e2" },
    converted: { bg: "#f5f3ff", text: "#8b5cf6", border: "#ede9fe" },
    expired: { bg: "#fff7ed", text: "#ea580c", border: "#ffedd5" },
  };

  const statusStyle = statusColors[estimate.status] || statusColors.draft;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        (navigation as any).navigate("EstimateForm", { id: estimate.id })
      }
    >
       <View style={styles.cardMain}>
        <View style={styles.estimateIconBox}>
          <Calculator size={20} color="#8b5cf6" />
        </View>
        <View style={styles.estimateMainInfo}>
          <View style={styles.estimateHeaderRow}>
            <Text style={styles.estimateNumber}>#{estimate.estimate_number}</Text>
            <Text style={styles.totalValue}>
              ${estimate.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <Text style={styles.customerName}>{estimate.customer_name || "Unknown Customer"}</Text>
          <View style={styles.estimateFooterRow}>
            <Text style={styles.dateValue}>{formatDate(estimate.date)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
               <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {estimate.status}
              </Text>
            </View>
          </View>
        </View>
        <ChevronRight size={18} color="#cbd5e1" style={{ marginLeft: 8 }} />
      </View>
    </TouchableOpacity>
  );
}

export function EstimatesScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: estimates, isLoading } = useQuery<Estimate>(
    `SELECT * FROM estimates 
         WHERE ($1 IS NULL OR customer_name LIKE $1 OR estimate_number LIKE $1) 
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
            placeholder="Search estimates..."
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
        data={estimates || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EstimateCard estimate={item} />}
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
               <Calculator size={48} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyText}>No estimates yet</Text>
            <Text style={styles.emptySubtext}>
              Send professional quotes to your clients and win more business.
            </Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={() => (navigation as any).navigate("EstimateForm")}
            >
              <Text style={styles.emptyAddButtonText}>Create New Estimate</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => (navigation as any).navigate("EstimateForm")}
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
  estimateIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  estimateMainInfo: {
    flex: 1,
  },
  estimateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  estimateNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#8b5cf6",
  },
  customerName: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  estimateFooterRow: {
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
