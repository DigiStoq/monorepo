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

interface Item {
  id: string;
  name: string;
  sku: string;
  type: string;
  sale_price: number;
  purchase_price: number;
  stock_quantity: number;
  low_stock_alert: number;
  is_active: number;
}

function ItemCard({ item }: { item: Item }) {
  const navigation = useNavigation();
  const isLowStock = item.stock_quantity <= (item.low_stock_alert || 0);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate("ItemForm", { id: item.id } as any);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.itemIcon}>
          <Text style={styles.itemIconText}>
            {item.type === "service" ? "🔧" : "📦"}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.sku && <Text style={styles.sku}>SKU: {item.sku}</Text>}
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            ${item.sale_price?.toFixed(2) || "0.00"}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.stockInfo}>
          <Text style={[styles.stockText, isLowStock && styles.lowStock]}>
            Stock: {item.stock_quantity || 0}
          </Text>
          {isLowStock && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockBadgeText}>Low</Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            item.is_active ? styles.activeBadge : styles.inactiveBadge,
          ]}
        >
          <Text style={styles.statusText}>
            {item.is_active ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ItemsScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: items, isLoading } = useQuery<Item>(
    `SELECT * FROM items 
     WHERE ($1 IS NULL OR name LIKE $1 OR sku LIKE $1) 
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
          placeholder="Search items..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            navigation.navigate("ItemForm" as any);
          }}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ItemCard item={item} />}
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
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubtext}>
              Add your first item to get started
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
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  itemIconText: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  sku: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#22c55e",
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
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stockText: {
    fontSize: 14,
    color: "#64748b",
  },
  lowStock: {
    color: "#f59e0b",
  },
  lowStockBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowStockBadgeText: {
    fontSize: 10,
    color: "#f59e0b",
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },
  inactiveBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#22c55e",
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
