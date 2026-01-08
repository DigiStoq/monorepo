import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@powersync/react-native";
import { Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react-native";
import { CashTransactionRecord } from "../lib/powersync";

export function CashInHandScreen() {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    
    // Balance Query
    const { data: balanceData } = useQuery<{ total: number }>(
        `SELECT SUM(CASE WHEN type = 'in' THEN amount WHEN type = 'out' THEN -amount ELSE 0 END) as total FROM cash_transactions`
    );
    const balance = balanceData?.[0]?.total || 0;

    // Transactions Query
    const { data: transactions } = useQuery<CashTransactionRecord>(
        `SELECT * FROM cash_transactions ORDER BY date DESC, created_at DESC LIMIT 50`
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    return (
        <View style={styles.container}>
            {/* Header / Balance Card */}
            <View style={styles.headerCard}>
                <Text style={styles.balanceLabel}>Current Cash Balance</Text>
                <Text style={styles.balanceValue}>
                    ${balance.toFixed(2)}
                </Text>
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => navigation.navigate("CashTransactionForm" as any)}
                >
                    <Plus color="white" size={24} />
                    <Text style={styles.addButtonText}>Record Transaction</Text>
                </TouchableOpacity>
            </View>

            {/* Transactions List */}
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <FlatList
                data={transactions || []}
                keyExtractor={(item) => item.id || item.created_at}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                }
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.transactionCard}
                        onPress={() => navigation.navigate("CashTransactionForm" as any, { id: item.id })}
                    >
                        <View style={styles.iconContainer}>
                            {item.type === 'in' ? (
                                <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
                                    <ArrowDownLeft color="#16a34a" size={20} />
                                </View>
                            ) : (
                                <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
                                    <ArrowUpRight color="#dc2626" size={20} />
                                </View>
                            )}
                        </View>
                        <View style={styles.txInfo}>
                            <Text style={styles.txDesc}>{item.description || "No Description"}</Text>
                            <Text style={styles.txDate}>{item.date}</Text>
                        </View>
                        <Text style={[
                            styles.txAmount,
                            { color: item.type === 'in' ? '#16a34a' : '#dc2626' }
                        ]}>
                            {item.type === 'in' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No transactions found</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    headerCard: {
        backgroundColor: "#6366f1",
        padding: 24,
        paddingTop: 32,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        alignItems: 'center',
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    balanceLabel: { color: "#e0e7ff", fontSize: 16, marginBottom: 8 },
    balanceValue: { color: "white", fontSize: 36, fontWeight: "bold", marginBottom: 24 },
    addButton: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        alignItems: "center",
        gap: 8,
    },
    addButtonText: { color: "white", fontWeight: "600", fontSize: 16 },
    sectionTitle: { fontSize: 18, fontWeight: "600", color: "#0f172a", margin: 16, marginBottom: 8 },
    listContent: { paddingHorizontal: 16, paddingBottom: 20 },
    transactionCard: {
        flexDirection: "row",
        backgroundColor: "white",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    iconContainer: { marginRight: 16 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    txInfo: { flex: 1 },
    txDesc: { fontSize: 16, fontWeight: "500", color: "#0f172a", marginBottom: 4 },
    txDate: { fontSize: 12, color: "#64748b" },
    txAmount: { fontSize: 16, fontWeight: "600" },
    emptyState: { alignItems: "center", padding: 40 },
    emptyText: { color: "#94a3b8" }
});
