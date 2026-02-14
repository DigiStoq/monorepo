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
import { useExpenses } from "../../hooks/useExpenses";
import { ReceiptIcon, PlusIcon, SearchIcon } from "../../components/ui/UntitledIcons";
import { useTheme } from "../../contexts/ThemeContext";

function ExpenseCard({ expense }: { expense: any }) {
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
        (navigation as any).navigate("ExpenseForm", { id: expense.id })
      }
    >
      <View className="flex-row items-center mb-2">
        <View className="w-10 h-10 rounded-md bg-surface-hover items-center justify-center mr-3">
          <ReceiptIcon size={20} color={colors.textSecondary} />
        </View>
        <View className="flex-1">
          <Text className="text-md font-semibold text-text">
            {expense.category?.toUpperCase() || "UNCATEGORIZED"}
          </Text>
          <Text className="text-xs text-text-muted mt-1">{formatDate(expense.date)}</Text>
        </View>
        <Text className="text-md font-bold text-text">${expense.amount?.toFixed(2)}</Text>
      </View>
      <View className="mt-0 pt-2 border-t border-border">
        <Text className="text-xs text-text-secondary">
          {expense.paidToName
            ? `Paid to: ${expense.paidToName}`
            : "Expense"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function ExpensesScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const { expenses, isLoading } = useExpenses({ search });

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
            placeholder="Search expenses..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          className="w-12 h-12 bg-primary rounded-lg items-center justify-center shadow-sm"
          onPress={() => (navigation as any).navigate("ExpenseForm")}
        >
          <PlusIcon size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpenseCard expense={item} />}
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
                <ReceiptIcon size={48} color={colors.textMuted} />
              </View>
              <Text className="text-lg font-semibold text-text mb-1">No expenses yet</Text>
              <Text className="text-sm text-text-muted">
                Record your business expenses here
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
