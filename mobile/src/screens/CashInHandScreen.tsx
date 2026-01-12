import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@powersync/react-native";
import { Search, ChevronRight, Wallet } from "lucide-react-native";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../lib/theme";
import { CustomHeader } from "../components/CustomHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";

// Define local interface for CashRecord
interface CashRecord {
  id: string;
  name: string;
  current_balance: number;
  description: string;
}

function CashAccountCard({ account, styles, colors }: { account: CashRecord, styles: any, colors: ThemeColors }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate("CashTransactionForm", { accountId: account.id } as any);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Wallet size={24} color={"#ffffff"} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{account.name}</Text>
          <Text style={styles.description} numberOfLines={1}>{account.description || "No description"}</Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardDetail}>Current Balance</Text>
        <Text
          style={[
            styles.balance,
            { color: (account.current_balance || 0) >= 0 ? colors.success : colors.danger },
          ]}
        >
          ${Math.abs(account.current_balance || 0).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function CashInHandScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // This is a placeholder as the exact schema for cash_accounts isn't visible
  // Assuming a similar structure or a single record for main cash
  const { data: accounts, isLoading } = useQuery<CashRecord>(
    `SELECT * FROM cash_accounts 
     WHERE ($1 IS NULL OR name LIKE $1) 
     ORDER BY name ASC`,
    [search ? `%${search}%` : null]
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Cash In Hand" showBack />

      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchText}
            placeholder="Search cash accounts..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={accounts || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CashAccountCard account={item} styles={styles} colors={colors} />}
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
          !isLoading ? (
            <View style={styles.empty}>
              <Wallet size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No cash accounts</Text>
              <Text style={styles.emptySubtext}>
                Managed your cash in hand here
              </Text>
            </View>
          ) : null
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
  searchBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardDetail: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  balance: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
