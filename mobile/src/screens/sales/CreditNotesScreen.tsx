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
import { wp, hp } from "../../lib/responsive";

interface CreditNote {
  id: string;
  credit_note_number: string;
  customer_name: string;
  date: string;
  total: number;
  reason: string;
}

function CreditNoteCard({ note }: { note: CreditNote }) {
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
        (navigation as any).navigate("CreditNoteForm", { id: note.id })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.info}>
          <Text style={styles.customerName}>
            {note.customer_name || "Unknown Customer"}
          </Text>
          <Text style={styles.date}>{formatDate(note.date)}</Text>
        </View>
        <Text style={styles.amount}>-${note.total?.toFixed(2)}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.reason}>
          {note.reason ? `Reason: ${note.reason}` : "Credit Note"}
        </Text>
        <Text style={styles.ref}>#{note.credit_note_number}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function CreditNotesScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: notes, isLoading } = useQuery<CreditNote>(
    `SELECT * FROM credit_notes 
         WHERE ($1 IS NULL OR customer_name LIKE $1 OR credit_note_number LIKE $1) 
         ORDER BY date DESC`,
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
          placeholder="Search credit notes..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => (navigation as any).navigate("CreditNoteForm")}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CreditNoteCard note={item} />}
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
            <Text style={styles.emptyIcon}>↩️</Text>
            <Text style={styles.emptyText}>No credit notes</Text>
            <Text style={styles.emptySubtext}>
              Record sales returns and credits
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    padding: wp(4),
    gap: wp(3),
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    color: "#0f172a",
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: "#6366f1",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: { color: "#ffffff", fontSize: 24, fontWeight: "600" },
  list: { padding: wp(4), paddingTop: 0, paddingBottom: hp(10) },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  info: { flex: 1 },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  date: { fontSize: 13, color: "#64748b" },
  amount: { fontSize: 16, fontWeight: "700", color: "#ef4444" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
    paddingTop: 8,
    marginTop: 4,
  },
  reason: { fontSize: 13, color: "#64748b" },
  ref: { fontSize: 12, color: "#94a3b8" },
  empty: { alignItems: "center", justifyContent: "center", marginTop: hp(10) },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  emptySubtext: { fontSize: 14, color: "#64748b" },
});
