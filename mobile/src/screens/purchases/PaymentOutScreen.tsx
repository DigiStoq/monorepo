import React, { useState, useCallback } from "react";
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
import { ArrowUpRight } from "lucide-react-native";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

interface PaymentOut {
  id: string;
  payment_number: string;
  customer_name: string; // Supplier Name
  date: string;
  amount: number;
  payment_mode: string;
  reference_number: string;
}

function PaymentOutCard({ payment }: { payment: PaymentOut }) {
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
        (navigation as any).navigate("PaymentOutForm", { id: payment.id })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <ArrowUpRight size={22} color={colors.danger} />
        </View>
        <View style={styles.info}>
          <View style={styles.row}>
            <Text style={styles.customerName}>
              {payment.customer_name || "Unknown Supplier"}
            </Text>
            <Text style={styles.amount}>${payment.amount?.toFixed(2)}</Text>
          </View>
          <Text style={styles.date}>{formatDate(payment.date)}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.mode}>{payment.payment_mode?.toUpperCase()}</Text>
        {payment.reference_number ? (
          <Text style={styles.ref}>Ref: {payment.reference_number}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function PaymentOutScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: payments, isLoading } = useQuery<PaymentOut>(
    `SELECT * FROM payment_outs 
         WHERE ($1 IS NULL OR customer_name LIKE $1 OR payment_number LIKE $1) 
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
          placeholder="Search payments..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => (navigation as any).navigate("PaymentOutForm")}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={payments || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PaymentOutCard payment={item} />}
        contentContainerStyle={styles.list}
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
              <View style={styles.emptyIconContainer}>
                <ArrowUpRight size={48} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyText}>No payments found</Text>
              <Text style={styles.emptySubtext}>
                Record your first payment to a supplier
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: colors.textOnAccent,
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
    borderRadius: borderRadius.full,
    backgroundColor: colors.dangerMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
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
    color: colors.danger,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  mode: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  ref: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
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
