import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { useQuery } from "@powersync/react-native";
import { useNavigation } from "@react-navigation/native";
import { PlusIcon, SearchIcon, FileTextIcon } from "../../components/ui/UntitledIcons";
import { useTheme } from "../../contexts/ThemeContext";

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  date: string;
  total: number;
  status: string;
  expected_date?: string;
}

export function PurchaseOrdersScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const { data: purchaseOrders, isLoading } = useQuery<PurchaseOrder>(`
        SELECT * FROM purchase_orders 
        ORDER BY date DESC, created_at DESC
    `);

  const filteredOrders = (purchaseOrders || []).filter(
    (order) =>
      order.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.po_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getStatusColor = (status = 'draft') => {
    switch (status.toLowerCase()) {
      case "sent":
        return { bg: colors.info + '20', text: colors.info };
      case "received":
        return { bg: colors.success + '20', text: colors.success };
      case "cancelled":
        return { bg: colors.surfaceHover, text: colors.textSecondary };
      case "draft":
      default:
        return { bg: colors.surfaceHover, text: colors.textSecondary };
    }
  };

  const renderItem = ({ item }: { item: PurchaseOrder }) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <TouchableOpacity
        className="bg-surface rounded-lg p-4 shadow-sm mb-3"
        activeOpacity={0.7}
        onPress={() => {
          (navigation as any).navigate("PurchaseOrderForm", { id: item.id });
        }}
      >
        <View className="flex-row items-center gap-3 mb-3">
          <View className="w-11 h-11 rounded-md bg-surface-hover justify-center items-center">
            <FileTextIcon size={22} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-md font-semibold text-text">{item.po_number || "Draft PO"}</Text>
            <Text className="text-sm text-text-secondary mt-0.5">{item.supplier_name}</Text>
          </View>
          <View
            className="px-2 py-1 rounded-sm"
            style={{ backgroundColor: statusStyle.bg }}
          >
            <Text
              className="text-xs font-bold capitalize"
              style={{ color: statusStyle.text }}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-border">
          <View>
            <Text className="text-xs text-text-muted">Date</Text>
            <Text className="text-sm text-text mt-0.5">{item.date}</Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-text-muted">Total</Text>
            <Text className="text-lg font-bold text-text">${item.total?.toFixed(2) || "0.00"}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 py-2">
        <View className="flex-row items-center bg-surface rounded-lg px-3 py-2 gap-2 border border-border">
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            className="flex-1 text-md text-text"
            placeholder="Search orders..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-20">
              <FileTextIcon size={48} color={colors.textMuted} />
              <Text className="text-lg font-semibold text-text mt-4">No purchase orders found</Text>
              <Text className="text-sm text-text-muted mt-1">
                Create a new order to send to suppliers
              </Text>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-primary justify-center items-center shadow-md"
        onPress={() => (navigation as any).navigate("PurchaseOrderForm")}
      >
        <PlusIcon size={24} color={"#ffffff"} />
      </TouchableOpacity>
    </View>
  );
}
