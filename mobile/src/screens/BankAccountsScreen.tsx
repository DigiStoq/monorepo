import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@powersync/react-native";
import { BankAccountRecord } from "../lib/powersync";
import { Search, ChevronRight, Landmark } from "lucide-react-native";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../lib/theme";
import { CustomHeader } from "../components/CustomHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function BankAccountCard({ account }: { account: BankAccountRecord }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate("BankAccountForm", { id: account.id } as any);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {account.bank_name ? account.bank_name.charAt(0).toUpperCase() : "B"}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{account.name}</Text>
          <Text style={styles.bankName}>{account.bank_name}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{account.account_type}</Text>
            </View>
          </View>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardDetail}>
          {account.account_number ? `**** ${account.account_number.slice(-4)}` : "No Account #"}
        </Text>
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

export function BankAccountsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: accounts, isLoading } = useQuery<BankAccountRecord>(
    `SELECT * FROM bank_accounts 
     WHERE ($1 IS NULL OR name LIKE $1 OR bank_name LIKE $1) 
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
      <CustomHeader />
      
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchText}
            placeholder="Search bank accounts..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={accounts || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BankAccountCard account={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Landmark size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No bank accounts</Text>
              <Text style={styles.emptySubtext}>
                Add your first bank account
              </Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => (navigation as any).navigate("BankAccountForm")}
              >
                <Text style={styles.addBtnText}>+ Add Account</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + spacing.xl }]}
        onPress={() => (navigation as any).navigate("BankAccountForm")}
      >
        <Text style={styles.fabText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textOnAccent,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  bankName: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  cardMeta: {
    flexDirection: "row",
    marginTop: 4,
  },
  badge: {
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    textTransform: "capitalize",
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
    fontFamily: Platform.OS === 'ios' ? "Courier" : "monospace",
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
  addBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  addBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textOnAccent,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  fabText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textOnAccent,
  },
});
