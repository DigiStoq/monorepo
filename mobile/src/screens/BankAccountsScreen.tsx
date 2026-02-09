import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@powersync/react-native";
import { Wallet, Plus, ChevronRight, Landmark } from "lucide-react-native";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../lib/theme";
import { useTheme } from "../contexts/ThemeContext";
import { CustomHeader } from "../components/CustomHeader";

interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  account_number: string;
  current_balance: number;
}

function AccountCard({ item, styles, colors, onPress }: any) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Landmark size={24} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.details}>{item.bank_name} •••• {item.account_number?.slice(-4)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.balance}>${(item.current_balance || 0).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function BankAccountsScreen() {
  // Note: Rename file/export to CashBankScreen if we want to unify, but existing nav might rely on "BankAccountsScreen".
  // I am creating this file as "CashBankScreen" but exporting "BankAccountsScreen" for compat or just making a new one.
  // Actually, looking at AppNavigator, "BankAccountsScreen" is registered.
  // I will overwrite `BankAccountsScreen` content here or create `CashBankScreen`.
  // The implementation plan said "Create CashBankScreen".

  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { data: accounts } = useQuery<BankAccount>("SELECT * FROM bank_accounts ORDER BY name ASC");

  // Also get Cash In Hand balance?
  // const { data: cash } = useQuery("...");

  return (
    <View style={styles.container}>
      <CustomHeader title="Cash & Bank" showBack />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.mainAction} onPress={() => navigation.navigate("CashInHand")}>
          <View style={styles.actionIcon}>
            <Wallet size={24} color="white" />
          </View>
          <Text style={styles.actionText}>Cash In Hand</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Bank Accounts</Text>
        <FlatList
          data={accounts}
          renderItem={({ item }) => (
            <AccountCard
              item={item}
              styles={styles}
              colors={colors}
              onPress={() => navigation.navigate("BankAccountForm", { id: item.id })}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No bank accounts found.</Text>}
        />
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("BankAccountForm")}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  actions: {
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  mainAction: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.md,
  },
  actionIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: borderRadius.lg,
  },
  actionText: {
    color: 'white',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  listContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
    paddingBottom: 80,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  details: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});
