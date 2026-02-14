import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePurchaseInvoices } from "../../hooks/usePurchaseInvoices";
import { PlusIcon, SearchIcon, FilterIcon, FileTextIcon } from "../../components/ui/UntitledIcons";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../lib/theme";

function PurchaseInvoiceCard({ item, colors }: { item: any, colors: ThemeColors }) {
  const navigation = useNavigation();

  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: colors.surfaceHover, text: colors.textSecondary },
    unpaid: { bg: colors.danger + '20', text: colors.danger },
    paid: { bg: colors.success + '20', text: colors.success },
    partial: { bg: colors.warning + '20', text: colors.warning },
    overdue: { bg: colors.danger + '20', text: colors.danger },
  };

  const statusStyle = statusColors[item.status?.toLowerCase()] || statusColors.draft;

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
      className="bg-surface rounded-lg p-4 shadow-sm mb-3"
      activeOpacity={0.7}
      onPress={() => {
        (navigation as any).navigate("PurchaseInvoiceDetail", { id: item.id });
      }}
    >
      <View className="flex-row items-center gap-3">
        <View className="w-11 h-11 rounded-md bg-surface-hover justify-center items-center">
          <FileTextIcon size={22} color={colors.primary} />
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-0.5">
            <Text className="text-md font-semibold text-text">{item.invoiceNumber || "Draft"}</Text>
            <Text className="text-lg font-bold text-text">
              ${item.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <Text className="text-sm text-text-secondary mb-2">{item.customerName || "Unknown Supplier"}</Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-xs text-text-muted">{formatDate(item.date)}</Text>
            <View
              className="px-2 py-1 rounded-sm"
              style={{ backgroundColor: statusStyle.bg }}
            >
              <Text
                className="text-xs font-bold uppercase"
                style={{ color: statusStyle.text }}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function PurchaseInvoicesScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const { invoices, isLoading } = usePurchaseInvoices({ search: searchQuery });

  const filteredInvoices = invoices || [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 py-2 flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center bg-surface rounded-lg px-3 py-2 gap-2 border border-border">
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            className="flex-1 text-md text-text"
            placeholder="Search bills..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Button Placeholder - if needed */}
        {/* <TouchableOpacity className="w-12 h-12 bg-surface rounded-lg justify-center items-center border border-border">
          <FilterIcon size={20} color={colors.textSecondary} />
        </TouchableOpacity> */}
      </View>

      <FlatList
        data={filteredInvoices}
        renderItem={({ item }) => <PurchaseInvoiceCard item={item} colors={colors} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
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
          !isLoading ? (
            <View className="items-center py-20 px-10">
              <View className="w-24 h-24 rounded-full bg-surface-hover justify-center items-center mb-6">
                <FileTextIcon size={48} color={colors.textMuted} />
              </View>
              <Text className="text-lg font-semibold text-text mb-2">No bills found</Text>
              <Text className="text-sm text-text-secondary text-center mb-6">
                Record your purchases and keep track of your expenses.
              </Text>
              <TouchableOpacity
                className="bg-surface border border-primary px-6 py-3 rounded-lg"
                onPress={() => (navigation as any).navigate("PurchaseInvoiceForm")}
              >
                <Text className="text-primary font-bold text-md">Add New Bill</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-primary justify-center items-center shadow-md"
        onPress={() => (navigation as any).navigate("PurchaseInvoiceForm")}
      >
        <PlusIcon size={24} color={"#ffffff"} />
      </TouchableOpacity>
    </View>
  );
}
