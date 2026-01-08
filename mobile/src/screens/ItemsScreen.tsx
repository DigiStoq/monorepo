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
import { Search, Plus, Filter, Package, ChevronRight, AlertCircle, Box } from "lucide-react-native";
import { wp, hp } from "../lib/responsive";

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
  const isLowStock = item.stock_quantity <= (item.low_stock_alert || 0) && item.type !== 'service';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        (navigation as any).navigate("ItemForm", { id: item.id });
      }}
    >
      <View style={styles.cardMain}>
        <View style={[styles.itemIconBox, { backgroundColor: item.type === 'service' ? '#ecfdf5' : '#eff6ff' }]}>
          {item.type === 'service' ? (
            <Package size={22} color="#10b981" />
          ) : (
            <Box size={22} color="#3b82f6" />
          )}
        </View>
        <View style={styles.itemMainInfo}>
          <View style={styles.itemHeaderRow}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.priceValue}>
              ${item.sale_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.itemSubRow}>
            <Text style={styles.skuText}>{item.sku || "No SKU"}</Text>
            {item.type !== 'service' && (
              <View style={styles.stockContainer}>
                <Text style={[styles.stockText, isLowStock && styles.lowStockText]}>
                  {item.stock_quantity || 0} in stock
                </Text>
                {isLowStock && <AlertCircle size={14} color="#ef4444" style={{ marginLeft: 4 }} />}
              </View>
            )}
            {item.type === 'service' && (
              <Text style={styles.serviceTag}>Service</Text>
            )}
          </View>
        </View>
        <ChevronRight size={18} color="#cbd5e1" style={{ marginLeft: 8 }} />
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
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products & services..."
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
        data={items || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ItemCard item={item} />}
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
                <Package size={48} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyText}>No items found</Text>
              <Text style={styles.emptySubtext}>
                Start building your catalog. Add products or services you offer.
              </Text>
              <TouchableOpacity 
                style={styles.emptyAddButton}
                onPress={() => (navigation as any).navigate("ItemForm")}
              >
                <Text style={styles.emptyAddButtonText}>Add New Item</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => (navigation as any).navigate("ItemForm")}
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
  itemIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemMainInfo: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10b981",
  },
  itemSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skuText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: '500',
  },
  lowStockText: {
    color: "#ef4444",
  },
  serviceTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
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
