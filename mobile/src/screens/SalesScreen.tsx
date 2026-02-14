import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSaleInvoices } from "../hooks/useSaleInvoices";
import { SearchIcon, ReceiptIcon, ChevronRightIcon } from "../components/ui/UntitledIcons";
import type { ThemeColors } from "../lib/theme";
import { spacing, borderRadius, fontSize, fontWeight, shadows, profColors } from "../lib/theme";
import { useTheme } from "../contexts/ThemeContext";

function InvoiceCard({ invoice, colors }: { invoice: any; colors: ThemeColors }) {
  const navigation = useNavigation();

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: profColors.items.bg, text: profColors.items.icon, border: profColors.items.border },
    sent: { bg: profColors.sales.bg, text: profColors.sales.icon, border: profColors.sales.border },
    paid: { bg: profColors.receivable.bg, text: profColors.receivable.icon, border: profColors.receivable.border },
    partial: { bg: profColors.warning.bg, text: profColors.warning.icon, border: profColors.warning.border },
    overdue: { bg: profColors.danger.bg, text: profColors.danger.icon, border: profColors.danger.border },
    pending: { bg: profColors.warning.bg, text: profColors.warning.icon, border: profColors.warning.border },
    cancelled: { bg: profColors.neutral.bg, text: profColors.neutral.icon, border: profColors.neutral.border },
  };

  const statusStyle = statusColors[invoice.status] || statusColors.draft;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <TouchableOpacity
      className="flex-row items-center bg-surface rounded-lg p-3 gap-3 shadow-sm"
      activeOpacity={0.7}
      onPress={() =>
        (navigation as any).navigate("SaleInvoiceDetail", { id: invoice.id })
      }
    >
      <View
        className="w-12 h-12 rounded-md justify-center items-center"
        style={{ backgroundColor: profColors.items.bg, borderWidth: 1, borderColor: profColors.items.border }}
      >
        <ReceiptIcon size={20} color={profColors.items.icon} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-0.5">
          <Text className="text-md font-semibold text-text">{invoice.invoiceNumber}</Text>
          <Text className="text-md font-bold text-accent">${invoice.total?.toFixed(2)}</Text>
        </View>
        <Text className="text-sm text-text-secondary mb-1">{invoice.customerName || "Unknown"}</Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-text-muted">{formatDate(invoice.date)}</Text>
          <View
            className="px-2 py-0.5 rounded-sm"
            style={{ backgroundColor: statusStyle.bg, borderWidth: 1, borderColor: statusStyle.border }}
          >
            <Text
              className="text-xs font-semibold capitalize"
              style={{ color: statusStyle.text }}
            >
              {invoice.status}
            </Text>
          </View>
        </View>
      </View>
      <ChevronRightIcon size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export function SalesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { colors } = useTheme();

  const { invoices, isLoading } = useSaleInvoices({ search });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); }, 1000);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Search Bar */}
      <View className="px-5 py-3">
        <View className="flex-row items-center bg-surface rounded-lg px-3 py-2 gap-2 border border-border">
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            className="flex-1 text-md text-text"
            placeholder="Search invoices..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={invoices}
        renderItem={({ item }) => <InvoiceCard invoice={item} colors={colors} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16 gap-2">
              <ReceiptIcon size={48} color={colors.textMuted} />
              <Text className="text-lg font-semibold text-text mt-3">No invoices yet</Text>
              <Text className="text-sm text-text-muted">Create your first sale</Text>
              <TouchableOpacity
                className="bg-accent px-6 py-3 rounded-full mt-3 shadow-md"
                onPress={() => (navigation as any).navigate("SaleInvoiceForm")}
              >
                <Text className="text-md font-semibold text-text-on-accent">+ New Invoice</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute right-5 bg-accent px-5 py-3 rounded-full shadow-md"
        style={{ bottom: insets.bottom + 80 }}
        onPress={() => (navigation as any).navigate("SaleInvoiceForm")}
      >
        <Text className="text-md font-semibold text-text-on-accent">+ New</Text>
      </TouchableOpacity>
    </View>
  );
}
