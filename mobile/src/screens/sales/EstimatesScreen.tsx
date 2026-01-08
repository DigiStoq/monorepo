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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "#22c55e";
      case "rejected":
        return "#ef4444";
      case "converted":
        return "#8b5cf6";
      case "sent":
        return "#3b82f6";
      default:
        return "#94a3b8";
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        (navigation as any).navigate("EstimateForm", { id: estimate.id })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.info}>
          <Text style={styles.customerName}>
            {estimate.customer_name || "Unknown Customer"}
          </Text>
          <Text style={styles.date}>{formatDate(estimate.date)}</Text>
        </View>
        <Text style={styles.amount}>${estimate.total?.toFixed(2)}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text
          style={[styles.status, { color: getStatusColor(estimate.status) }]}
        >
          {estimate.status?.toUpperCase()}
        </Text>
        <Text style={styles.ref}>#{estimate.estimate_number}</Text>
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
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search estimates..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => (navigation as any).navigate("EstimateForm")}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={estimates || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EstimateCard estimate={item} />}
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
            <Text style={styles.emptyText}>No estimates yet</Text>
            <Text style={styles.emptySubtext}>
              Create quotes for your customers
            </Text>
          </View>
        }
      />
    </View>
  );
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
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    color: "#0f172a",
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: "#6366f1",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "600",
  },
  list: {
    padding: wp(4),
    paddingTop: 0,
    paddingBottom: hp(10),
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  info: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: "#64748b",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6366f1",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
    paddingTop: 8,
    marginTop: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
  },
  ref: {
    fontSize: 12,
    color: "#94a3b8",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(10),
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748b",
  },
});
