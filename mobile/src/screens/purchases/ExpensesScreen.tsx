import React, { useState, useCallback, useMemo } from "react";
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
import { Receipt } from "lucide-react-native";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../../lib/theme";
import { useTheme } from "../../contexts/ThemeContext";

interface Expense {
  id: string;
  expense_number: string;
  category: string;
  date: string;
  amount: number;
  paid_to_name: string;
  notes: string;
}

function ExpenseCard({ expense, styles, colors }: { expense: Expense, styles: any, colors: ThemeColors }) {
  const navigation = useNavigation();

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
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        (navigation as any).navigate("ExpenseForm", { id: expense.id })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Receipt size={20} color={colors.textSecondary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.category}>
            {expense.category?.toUpperCase() || "UNCATEGORIZED"}
          </Text>
          <Text style={styles.date}>{formatDate(expense.date)}</Text>
        </View>
        <Text style={styles.amount}>${expense.amount?.toFixed(2)}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.paidTo}>
          {expense.paid_to_name
            ? `Paid to: ${expense.paid_to_name}`
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
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Simple search filter
  const { data: expenses, isLoading } = useQuery<Expense>(
    `SELECT * FROM expenses 
         WHERE ($1 IS NULL OR category LIKE $1 OR paid_to_name LIKE $1) 
         ORDER BY date DESC`,
    [search ? `%${search}%` : null]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => (navigation as any).navigate("ExpenseForm")}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpenseCard expense={item} styles={styles} colors={colors} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
              <Receipt size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>
              Record your business expenses here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.text,
    fontSize: fontSize.md,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: fontWeight.semibold,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
    gap: spacing.md,
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
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  category: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  cardFooter: {
    marginTop: 0,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paidTo: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyIconContainer: {
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
