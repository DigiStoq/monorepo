import React, { useState } from "react";
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
import { BankAccountRecord } from "../lib/powersync";

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
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardDetail}>
          {account.account_number ? `**** ${account.account_number.slice(-4)}` : "No Account #"}
        </Text>
        <Text
          style={[
            styles.balance,
            { color: (account.current_balance || 0) >= 0 ? "#22c55e" : "#ef4444" },
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
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search bank accounts..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            navigation.navigate("BankAccountForm" as any);
          }}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={accounts || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BankAccountCard account={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏦</Text>
            <Text style={styles.emptyText}>No bank accounts found</Text>
            <Text style={styles.emptySubtext}>
              Add your first bank account to get started
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: "#6366f1",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
  },
  list: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4338ca",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  bankName: {
    fontSize: 14,
    color: "#64748b",
  },
  cardMeta: {
    flexDirection: "row",
    marginTop: 4,
    gap: 8,
  },
  badge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#475569",
    textTransform: "capitalize",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  cardDetail: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "monospace",
  },
  balance: {
    fontSize: 16,
    fontWeight: "600",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
});
