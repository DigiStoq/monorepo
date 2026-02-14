import { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { WalletIcon, PlusIcon, BankIcon } from "../components/ui/UntitledIcons";
import { useTheme } from "../contexts/ThemeContext";
import { CustomHeader } from "../components/CustomHeader";
import { useBankAccounts } from "../hooks/useBankAccounts";
import type { BankAccount } from "../hooks/useBankAccounts";
import { useCashBalance } from "../hooks/useCashTransactions";

function AccountCard({ item, colors, onPress }: { item: BankAccount, colors: any, onPress: () => void }) {
  return (
    <TouchableOpacity
      className="flex-row items-center bg-background p-4 rounded-lg border border-border"
      onPress={onPress}
    >
      <View className="w-10 h-10 rounded-full items-center justify-center bg-primary-10" style={{ backgroundColor: `${colors.primary as string}15` }}>
        <BankIcon size={24} color={colors.primary} />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-md font-semibold text-text">{item.name}</Text>
        <Text className="text-xs text-text-muted mt-0.5">{item.bankName} •••• {item.accountNumber?.slice(-4)}</Text>
      </View>
      <View className="items-end">
        <Text className="text-md font-bold text-success" style={{ color: colors.success }}>${(item.currentBalance || 0).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function BankAccountsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const { accounts, isLoading: accountsLoading } = useBankAccounts();
  const { balance: cashBalance, isLoading: cashLoading } = useCashBalance();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); }, 1000);
  }, []);

  return (
    <View className="flex-1 bg-background">
      <CustomHeader title="Cash & Bank" showBack />

      <View className="p-5 flex-row gap-4">
        <TouchableOpacity
          className="flex-1 bg-primary rounded-xl p-5 flex-row items-center gap-4 shadow-md"
          style={{ backgroundColor: colors.primary }}
          onPress={() => navigation.navigate("CashInHand")}
        >
          <View className="bg-white/20 p-2 rounded-lg">
            <WalletIcon size={24} color="white" />
          </View>
          <View>
            <Text className="text-white/80 text-sm font-medium">Cash In Hand</Text>
            <Text className="text-white text-xl font-bold">${(cashBalance || 0).toFixed(2)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="flex-1 bg-surface rounded-t-3xl p-5 shadow-sm">
        <Text className="text-md font-bold text-text mb-4">Bank Accounts</Text>
        <FlatList
          data={accounts || []}
          renderItem={({ item }) => (
            <AccountCard
              item={item}
              colors={colors}
              onPress={() => navigation.navigate("BankAccountForm", { id: item.id })}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <Text className="text-center text-text-muted mt-5">No bank accounts found.</Text>
          }
        />
      </View>

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-5 right-5 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: colors.primary }}
        onPress={() => navigation.navigate("BankAccountForm")}
      >
        <PlusIcon size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
