import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { usePurchasesBySupplierReport, DateRange } from "../../hooks/useReports";

export function PurchasesBySupplierScreen() {
    const navigation = useNavigation();
    
    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = usePurchasesBySupplierReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Text style={styles.name}>{item.supplier_name}</Text>
                <Text style={styles.amount}>{formatCurrency(item.total_amount)}</Text>
            </View>
            <Text style={styles.count}>{item.invoice_count} invoices</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Purchases By Supplier</Text>
                 <TouchableOpacity style={styles.iconBtn}>
                    <Calendar color="#64748b" size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.dateDisplay}>
                    <Text style={styles.dateText}>{dateRange.from} - {dateRange.to}</Text>
                </View>

                {isLoading ? (
                     <Text style={styles.loadingText}>Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.supplier_id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No purchases found.</Text>}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderColor: "#e2e8f0", marginTop: Platform.OS === 'android' ? 24 : 0 },
    iconBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: "#0f172a" },
    content: { flex: 1 },
    dateDisplay: { alignItems: 'center', padding: 12, backgroundColor: '#f1f5f9' },
    dateText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    list: { padding: 16, gap: 12 },
    loadingText: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    amount: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    count: { fontSize: 12, color: '#64748b' },
});
