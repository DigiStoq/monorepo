import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@powersync/react-native";
import { Search, ChevronRight, Box, Plus } from "lucide-react-native";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../lib/theme";
import { useTheme } from "../contexts/ThemeContext";

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
  image_url?: string; // Assuming we might have this, or fallback
}

/**
 * Filter Tabs Component
 */
const FilterTabs = ({ activeTab, setActiveTab, counts, colors, styles }: any) => {
  const tabs = [
    { id: 'all', label: 'Total Stock', count: counts.all },
    { id: 'out', label: 'Out of Stock', count: counts.out },
    { id: 'low', label: 'Low Stock', count: counts.low },
  ];

  return (
    <View style={styles.tabsContainer}>
      <FlatList
        data={tabs}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        renderItem={({ item }) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              style={[
                styles.tab,
                isActive && styles.activeTab
              ]}
              onPress={() => setActiveTab(item.id)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

function ItemCard({ item, styles, colors }: { item: Item, styles: any, colors: ThemeColors }) {
  const navigation = useNavigation();
  const isOutOfStock = (item.stock_quantity || 0) <= 0 && item.type !== 'service';
  // Use a fixed threshold or item specific alert
  const isLowStock = !isOutOfStock && (item.stock_quantity || 0) <= (item.low_stock_alert || 10) && item.type !== 'service';

  let statusColor: string = colors.success;
  let statusBg = colors.success + '20'; // 20% opacity
  let statusText = "In Stock";

  if (isOutOfStock) {
    statusColor = colors.danger;
    statusBg = colors.danger + '20';
    statusText = "Out of Stock";
  } else if (isLowStock) {
    statusColor = colors.warning;
    statusBg = colors.warning + '20';
    statusText = "Low Stock";
  }

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        (navigation as any).navigate("ItemForm", { id: item.id });
      }}
    >
      <View style={styles.thumbnail}>
        {/* Placeholder for image */}
        <Box size={24} color={colors.textMuted} />
        {/* <Image source={{ uri: '...' }} style={...} /> */}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemSku}>SKU: {item.sku || "N/A"}</Text>
      </View>
      <View style={styles.itemRight}>
        {item.type !== 'service' && <Text style={styles.itemStock}>{item.stock_quantity || 0} in Stock</Text>}
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ItemsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'out' | 'low'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Dynamic Query based on tab
  // Note: PowerSync useQuery reactive strings need to be careful. 
  // We'll construct the WHERE clause.
  // Parametrized query is safer.

  let filterClause = "";
  if (activeTab === 'out') {
    filterClause = "AND quantity <= 0";
  } else if (activeTab === 'low') {
    filterClause = "AND quantity > 0 AND quantity < 10"; // Hardcoded threshold for now matching dashboard
  }

  const { data: items, isLoading } = useQuery<Item>(
    `SELECT * FROM items 
     WHERE ($1 IS NULL OR name LIKE $1 OR sku LIKE $1) 
     ${filterClause}
     ORDER BY name ASC`,
    [search ? `%${search}%` : null]
  );

  // Counts for tabs
  const { data: allCountData } = useQuery<{ count: number }>("SELECT COUNT(*) as count FROM items");
  const { data: outCountData } = useQuery<{ count: number }>("SELECT COUNT(*) as count FROM items WHERE stock_quantity <= 0 AND type != 'service'");
  const { data: lowCountData } = useQuery<{ count: number }>("SELECT COUNT(*) as count FROM items WHERE stock_quantity > 0 AND stock_quantity <= (COALESCE(low_stock_alert, 0)) AND type != 'service'");

  const counts = {
    all: allCountData?.[0]?.count || 0,
    out: outCountData?.[0]?.count || 0,
    low: lowCountData?.[0]?.count || 0
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => (navigation as any).navigate("ItemForm")}
        >
          <Text style={styles.headerButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchText}
            placeholder="Search..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Tabs */}
      <FilterTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={{ all: 0, out: 0, low: 0 }} // mocks
        colors={colors}
        styles={styles}
      />

      <FlatList
        data={items}
        renderItem={({ item }) => <ItemCard item={item} styles={styles} colors={colors} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 28, // Large title
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  headerButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  searchBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface, // Start white/surface
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12, // slightly taller
    gap: spacing.md,
    ...shadows.sm, // elevated look
  },
  searchText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  tabsContainer: {
    marginBottom: spacing.md,
  },
  tabsContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg, // slightly rounded
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTab: {
    backgroundColor: colors.primary + '20', // Light primary bg
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary, // Primary text
    fontWeight: fontWeight.semibold,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  thumbnail: {
    width: 56,
    height: 56,
    backgroundColor: colors.surfaceHover,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  itemSku: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemStock: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
