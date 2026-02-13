import React, { useState, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCustomers } from "../hooks/useCustomers";
import { SearchIcon, UsersIcon, ChevronRightIcon } from "../components/ui/UntitledIcons";
import { CustomHeader } from "../components/CustomHeader";
import { useTheme } from "../contexts/ThemeContext";
import type { ThemeColors } from "../lib/theme";
import { profColors } from "../lib/theme";

function CustomerCard({ customer, colors }: { customer: any, colors: ThemeColors }) {
  const navigation = useNavigation();
  const typeColors: Record<string, { bg: string; text: string; border: string }> = {
    customer: { bg: profColors.receivable.bg, text: profColors.receivable.icon, border: profColors.receivable.border },
    supplier: { bg: profColors.payable.bg, text: profColors.payable.icon, border: profColors.payable.border },
    both: { bg: profColors.sales.bg, text: profColors.sales.icon, border: profColors.sales.border },
  };

  const typeStyle = typeColors[customer.type] || typeColors.customer;

  // Avatar Color logic based on name
  const getAvatarColor = (name: string) => {
    const charCode = name.charCodeAt(0) || 0;
    const variants = [profColors.primary, profColors.sales, profColors.receivable, profColors.neutral];
    return variants[charCode % variants.length];
  };

  const avatarStyle = getAvatarColor(customer.name || "?");

  return (
    <TouchableOpacity
      className="flex-row items-center bg-surface rounded-lg p-3 gap-3 shadow-sm"
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate("CustomerDetail" as never, { id: customer.id } as never);
      }}
    >
      <View
        className="w-12 h-12 rounded-full justify-center items-center border"
        style={{ backgroundColor: avatarStyle.bg, borderColor: avatarStyle.border }}
      >
        <Text className="text-lg font-bold" style={{ color: avatarStyle.icon }}>
          {customer.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-0.5">
          <Text className="text-md font-semibold text-text flex-1" numberOfLines={1}>{customer.name}</Text>
          <View
            className="px-2 py-0.5 rounded-sm ml-2 border"
            style={{ backgroundColor: typeStyle.bg, borderColor: typeStyle.border }}
          >
            <Text className="text-xs font-semibold capitalize" style={{ color: typeStyle.text }}>
              {customer.type}
            </Text>
          </View>
        </View>
        {customer.phone && (
          <Text className="text-sm text-text-secondary mb-0.5">{customer.phone}</Text>
        )}
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-text-muted">{customer.email || "No email"}</Text>
          <Text className={`text-sm font-bold ${customer.currentBalance >= 0 ? 'text-success' : 'text-danger'}`} style={{ color: customer.currentBalance >= 0 ? colors.success : colors.danger }}>
            ${Math.abs(customer.currentBalance || 0).toFixed(2)}
          </Text>
        </View>
      </View>
      <ChevronRightIcon size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export function CustomersScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const { customers, isLoading } = useCustomers({ search, isActive: true });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View className="flex-1 bg-background">
      <CustomHeader title="Customers" />

      {/* Search Bar */}
      <View className="px-5 py-3">
        <View className="flex-row items-center bg-surface rounded-lg px-3 py-2 gap-2 border border-border">
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            className="flex-1 text-md text-text"
            placeholder="Search customers..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={customers}
        renderItem={({ item }) => <CustomerCard customer={item} colors={colors} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 8 }}
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
            <View className="items-center py-16 gap-2">
              <UsersIcon size={48} color={colors.textMuted} />
              <Text className="text-lg font-semibold text-text mt-4">No customers yet</Text>
              <Text className="text-sm text-text-muted">Add your first customer or supplier</Text>
              <TouchableOpacity
                className="bg-primary px-6 py-3 rounded-full mt-4"
                onPress={() => (navigation as any).navigate("CustomerForm")}
              >
                <Text className="text-md font-semibold text-white">+ Add Customer</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute right-5 bg-primary px-5 py-3 rounded-full shadow-md"
        style={{ bottom: insets.bottom + 80 }}
        onPress={() => (navigation as any).navigate("CustomerForm")}
      >
        <Text className="text-md font-semibold text-white">+ Add</Text>
      </TouchableOpacity>
    </View>
  );
}
