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

interface Customer {
  id: string;
  name: string;
  type: string;
  phone: string;
  email: string;
  current_balance: number;
}

function CustomerCard({ customer }: { customer: Customer }) {
  const navigation = useNavigation();
  const typeColors: Record<string, string> = {
    customer: "#22c55e",
    supplier: "#f59e0b",
    both: "#6366f1",
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate("CustomerForm", { id: customer.id } as any);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {customer.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{customer.name}</Text>
          <View style={styles.cardMeta}>
            <View
              style={[
                styles.badge,
                { backgroundColor: typeColors[customer.type] + "20" },
              ]}
            >
              <Text
                style={[styles.badgeText, { color: typeColors[customer.type] }]}
              >
                {customer.type}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.cardFooter}>
        {customer.phone && (
          <Text style={styles.cardDetail}>📞 {customer.phone}</Text>
        )}
        <Text
          style={[
            styles.balance,
            { color: customer.current_balance >= 0 ? "#22c55e" : "#ef4444" },
          ]}
        >
          ${Math.abs(customer.current_balance || 0).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function CustomersScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: customers, isLoading } = useQuery<Customer>(
    `SELECT * FROM customers 
     WHERE ($1 IS NULL OR name LIKE $1) 
     ORDER BY name ASC`,
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
          placeholder="Search customers..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            navigation.navigate("CustomerForm" as any);
          }}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={customers || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CustomerCard customer={item} />}
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
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No customers found</Text>
            <Text style={styles.emptySubtext}>
              Add your first customer to get started
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
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  addButton: {
    width: 48,
    height: 48,
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
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  cardMeta: {
    flexDirection: "row",
    marginTop: 4,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  cardDetail: {
    fontSize: 14,
    color: "#64748b",
  },
  balance: {
    fontSize: 16,
    fontWeight: "600",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
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
