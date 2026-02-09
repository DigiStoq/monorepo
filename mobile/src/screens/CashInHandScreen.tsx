import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowUpRightIcon, ArrowDownLeftIcon, WalletIcon, PlusIcon } from "../components/ui/UntitledIcons";
import { CustomHeader } from "../components/CustomHeader";
import { useTheme } from "../contexts/ThemeContext";
import { useCashTransactions, useCashBalance } from "../hooks/useCashTransactions";
import type { CashTransaction } from "../hooks/useCashTransactions";

function TransactionCard({ item, colors, onPress }: { item: CashTransaction, colors: any, onPress: () => void }) {
  return (
    <TouchableOpacity
      className="bg-surface rounded-lg p-4 shadow-sm mb-3 border border-border"
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-4">
        <View className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: item.type === 'in' ? `${colors.success as string}20` : `${colors.danger as string}20` }}>
          {item.type === 'in'
            ? <ArrowDownLeftIcon color={colors.success} size={20} />
            : <ArrowUpRightIcon color={colors.danger} size={20} />
          }
        </View>
        <View className="flex-1">
          <Text className="text-md font-semibold text-text">{item.description || "Cash Transaction"}</Text>
          <Text className="text-sm text-text-muted mt-0.5">{item.category || "Uncategorized"} • {item.date}</Text>
        </View>
        <Text
          className="text-md font-bold"
          style={{ color: item.type === 'in' ? colors.success : colors.text }}
        >
          {item.type === 'in' ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function CashInHandScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const { transactions, isLoading: loadingTx } = useCashTransactions();
  const { balance, isLoading: loadingBalance } = useCashBalance();

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View className="flex-1 bg-background relative">
      <CustomHeader title="Cash In Hand" showBack />

      <View className="p-5 items-center bg-surface border-b border-border shadow-sm">
        <Text className="text-sm text-text-muted mb-1">Current Balance</Text>
        <Text className="text-4xl font-bold text-primary" style={{ color: colors.primary }}>${balance.toFixed(2)}</Text>
      </View>

      <View className="flex-1 p-5">
        <Text className="text-md font-bold text-text mb-4">Recent Transactions</Text>
        <FlatList
          data={transactions || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionCard
              item={item}
              colors={colors}
              onPress={() => (navigation as any).navigate("CashTransactionForm", { id: item.id })}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
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
            !loadingTx ? (
              <View className="items-center py-12 gap-3">
                <View className="w-16 h-16 rounded-full bg-surface-hover items-center justify-center">
                  <WalletIcon size={32} color={colors.textMuted} />
                </View>
                <Text className="text-lg font-semibold text-text mt-2">No transactions yet</Text>
                <Text className="text-sm text-text-muted">Record cash coming in or going out</Text>
              </View>
            ) : null
          }
        />
      </View>

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg bg-primary"
        style={{ backgroundColor: colors.primary }}
        onPress={() => (navigation as any).navigate("CashTransactionForm")}
      >
        <PlusIcon size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
