import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePaymentOuts } from "../../hooks/usePaymentOuts";
import { ArrowUpRightIcon, PlusIcon, SearchIcon } from "../../components/ui/UntitledIcons";
import { useTheme } from "../../contexts/ThemeContext";

function PaymentOutCard({ payment }: { payment: any }) {
  const navigation = useNavigation();
  const { colors } = useTheme();

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
      className="bg-surface rounded-lg p-4 shadow-sm"
      activeOpacity={0.7}
      onPress={() =>
        (navigation as any).navigate("PaymentOutForm", { id: payment.id })
      }
    >
      <View className="flex-row items-center mb-2">
        <View className="w-10 h-10 rounded-full bg-danger-10 items-center justify-center mr-3">
          <ArrowUpRightIcon size={22} color={colors.danger} />
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-center">
            <Text className="text-md font-semibold text-text">
              {payment.customerName || "Unknown Supplier"}
            </Text>
            <Text className="text-md font-bold text-danger">${payment.amount?.toFixed(2)}</Text>
          </View>
          <Text className="text-xs text-text-muted mt-1">{formatDate(payment.date)}</Text>
        </View>
      </View>
      <View className="flex-row justify-between items-center mt-1 pt-2 border-t border-border">
        <View className="bg-surface-hover px-2 py-0.5 rounded-sm">
          <Text className="text-xs font-medium text-text-secondary uppercase">{payment.paymentMode}</Text>
        </View>
        {payment.referenceNumber ? (
          <Text className="text-xs text-text-muted">Ref: {payment.referenceNumber}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function PaymentOutScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const { payments, isLoading } = usePaymentOuts({ search });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center p-4 py-2 gap-2">
        <View className="flex-1 flex-row items-center bg-surface rounded-lg px-3 py-2 border border-border">
          <SearchIcon size={20} color={colors.textMuted} />
          <TextInput
            className="flex-1 ml-2 text-base text-text"
            placeholder="Search payments..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          className="w-12 h-12 bg-primary rounded-lg items-center justify-center shadow-sm"
          onPress={() => (navigation as any).navigate("PaymentOutForm")}
        >
          <PlusIcon size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={payments || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PaymentOutCard payment={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, gap: 12 }}
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
            <View className="items-center justify-center mt-20">
              <View className="mb-4">
                <ArrowUpRightIcon size={48} color={colors.textMuted} />
              </View>
              <Text className="text-lg font-semibold text-text mb-1">No payments found</Text>
              <Text className="text-sm text-text-muted">
                Record your first payment to a supplier
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
