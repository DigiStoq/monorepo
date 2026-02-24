import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useItems, useItemStats } from "../hooks/useItems";
import { CustomHeader } from "../components/CustomHeader";
import { SearchIcon, PlusIcon, BoxIcon } from "../components/ui/UntitledIcons";
import type { ThemeColors } from "../lib/theme";
import { getProfColors } from "../lib/theme";
import { useTheme } from "../contexts/ThemeContext";

interface Item {
  id: string;
  name: string;
  sku: string;
  type: string;
  salePrice: number;
  purchasePrice: number;
  stockQuantity: number;
  lowStockAlert: number;
  isActive: boolean;
  image_url?: string;
}

/**
 * Filter Tabs Component
 */
const FilterTabs = ({ activeTab, setActiveTab, counts, colors }: any) => {
  const tabs = [
    { id: 'all', label: 'Total Stock', count: counts.all },
    { id: 'out', label: 'Out of Stock', count: counts.out },
    { id: 'low', label: 'Low Stock', count: counts.low },
  ];

  return (
    <View className="mb-4">
      <FlatList
        data={tabs}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 4 }}
        renderItem={({ item }) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              className={`px-4 py-2 rounded-lg border ${isActive ? 'bg-primary-20 border-primary' : 'bg-transparent border-border'}`}
              onPress={() => setActiveTab(item.id)}
            >
              <Text className={`text-sm font-medium ${isActive ? 'text-primary font-semibold' : 'text-text-secondary'}`}>
                {item.label} ({item.count})
              </Text>
            </TouchableOpacity>
          );
        }}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

function ItemCard({ item, colors }: { item: any, colors: ThemeColors }) {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const profColors = getProfColors(isDark);
  const isOutOfStock = (item.stockQuantity || 0) <= 0 && item.type !== 'service';
  const isLowStock = !isOutOfStock && (item.stockQuantity || 0) <= (item.lowStockAlert || 0) && item.type !== 'service';

  let statusStyle = { bg: profColors.receivable.bg, text: profColors.receivable.icon, border: profColors.receivable.border, label: "In Stock" };

  if (isOutOfStock) {
    statusStyle = { bg: profColors.danger.bg, text: profColors.danger.icon, border: profColors.danger.border, label: "Out of Stock" };
  } else if (isLowStock) {
    statusStyle = { bg: profColors.warning.bg, text: profColors.warning.icon, border: profColors.warning.border, label: "Low Stock" };
  } else if (item.type === 'service') {
    statusStyle = { bg: profColors.items.bg, text: profColors.items.icon, border: profColors.items.border, label: "Service" };
  }

  return (
    <TouchableOpacity
      className="flex-row items-center bg-surface rounded-xl p-3 gap-3 shadow-sm"
      activeOpacity={0.7}
      onPress={() => {
        (navigation as any).navigate("ItemDetail", { id: item.id });
      }}
    >
      <View
        className="w-14 h-14 bg-surface-hover rounded-lg justify-center items-center"
        style={{ backgroundColor: profColors.items.bg, borderWidth: 1, borderColor: profColors.items.border }}
      >
        <BoxIcon size={24} color={profColors.items.icon} />
      </View>
      <View className="flex-1 justify-center mr-2">
        <Text className="text-md font-bold text-text mb-1" numberOfLines={1} style={{ flexShrink: 1 }}>{item.name}</Text>
        <Text className="text-xs text-text-muted">SKU: {item.sku || "N/A"}</Text>
      </View>
      <View className="items-end gap-1 shrink-0">
        {item.type !== 'service' && <Text className="text-sm font-medium text-text">{item.stockQuantity || 0} in Stock</Text>}
        <View
          className="px-2 py-0.5 rounded-sm"
          style={{ backgroundColor: statusStyle.bg, borderWidth: 1, borderColor: statusStyle.border }}
        >
          <Text
            className="text-[10px] font-bold"
            style={{ color: statusStyle.text }}
          >
            {statusStyle.label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ItemsScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'out' | 'low'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const { items, isLoading } = useItems({
    search,
    lowStock: activeTab === 'low',
    isActive: true, // Only show active items
  });

  const { totalItems, lowStockItems, outOfStock } = useItemStats();

  const filteredItems = useMemo(() => {
    if (activeTab === 'out') return items.filter(i => i.stockQuantity <= 0 && i.type !== 'service');
    // useItems already handles lowStock if we pass it, but for 'all' vs 'low' we can use that.
    return items;
  }, [items, activeTab]);

  const counts = {
    all: totalItems,
    out: outOfStock,
    low: lowStockItems
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View className="flex-1 bg-background">
      <CustomHeader
        title="Inventory"
        rightAction={
          <TouchableOpacity
            className="p-2"
            onPress={() => (navigation as any).navigate("ItemForm")}
          >
            <PlusIcon size={20} color={colors.text} />
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View className="px-5 pb-4">
        <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 gap-3 shadow-sm">
          <SearchIcon size={20} color={colors.textSecondary} />
          <TextInput
            className="flex-1 text-md text-text"
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
        counts={counts}
        colors={colors}
      />

      <FlatList
        data={filteredItems}
        renderItem={({ item }) => <ItemCard item={item} colors={colors} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 12 }}
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
          <View className="items-center py-16">
            <Text className="text-sm text-text-muted">No items found</Text>
          </View>
        }
      />
    </View>
  );
}
