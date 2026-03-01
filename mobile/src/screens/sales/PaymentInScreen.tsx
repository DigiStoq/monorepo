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
import { wp, hp } from "../../lib/responsive";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../lib/theme";
import { usePaymentIns } from "../../hooks/usePaymentIns";
import type { PaymentIn } from "../../hooks/usePaymentIns";
import { WalletIcon, SearchIcon, PlusIcon } from "../../components/ui/Icons";

function PaymentCard({ payment, styles, colors }: { payment: PaymentIn, styles: any, colors: ThemeColors }) {
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

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        (navigation as any).navigate("PaymentInForm", { id: payment.id })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.info}>
          <Text style={styles.customerName}>
            {payment.customerName || "Unknown Customer"}
          </Text>
          <Text style={styles.date}>
            {formatDate(payment.date)}
            {payment.createdAt && ` • ${formatTime(payment.createdAt)}`}
          </Text>
        </View>
        <Text style={styles.amount}>${payment.amount?.toFixed(2)}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.mode}>{payment.paymentMode?.toUpperCase()}</Text>
        {payment.referenceNumber ? (
          <Text style={styles.ref}>Ref: {payment.referenceNumber}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function PaymentInScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { payments, isLoading } = usePaymentIns({ search });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchInputWrapper}>
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search payments..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => (navigation as any).navigate("PaymentInForm")}
        >
          <PlusIcon size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={payments || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PaymentCard payment={item} styles={styles} colors={colors} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={{ marginBottom: 16 }}>
              <WalletIcon size={56} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>No payments found</Text>
            <Text style={styles.emptySubtext}>
              Record your first payment received
            </Text>
          </View>
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
  header: {
    flexDirection: "row",
    padding: wp(4),
    gap: wp(3),
    alignItems: "center",
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    height: '100%',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  list: {
    padding: wp(4),
    paddingTop: 0,
    paddingBottom: hp(10),
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  info: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.success,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8,
    marginTop: 4,
  },
  mode: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    paddingVertical: 2,
    letterSpacing: 0.5,
  },
  ref: {
    fontSize: 12,
    color: colors.textMuted,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(10),
  },
  // emptyIcon removed
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
