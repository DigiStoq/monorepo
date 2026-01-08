import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { useItemProfitabilityReport, DateRange } from "../../hooks/useReports";

export function ItemProfitabilityScreen() {
    const navigation = useNavigation();
    
    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useItemProfitabilityReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => {
        const margin = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : "0";
        return (
            <View style={styles.card}>
                <View style={styles.cardRow}>
                    <Text style={styles.name}>{item.item_name}</Text>
                    <Text style={[styles.profit, item.profit >= 0 ? styles.positive : styles.negative]}>
                        {formatCurrency(item.profit)}
                    </Text>
                </View>
                <View style={styles.detailsRow}>
                    <Text style={styles.detail}>Sold: {item.quantity_sold}</Text>
                    <Text style={styles.detail}>Rev: {formatCurrency(item.revenue)}</Text>
                    <Text style={styles.detail}>Cost: {formatCurrency(item.cost)}</Text>
                </View>
                <View style={styles.marginRow}>
                    <Text style={styles.marginLabel}>Margin:</Text>
                    <Text style={[styles.marginValue, item.profit >= 0 ? styles.positive : styles.negative]}>
                        {margin}%
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Item Profitability</Text>
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
                        keyExtractor={item => item.item_id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No sales data available.</Text>}
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
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    profit: { fontSize: 16, fontWeight: '700' },
    detailsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    detail: { fontSize: 12, color: '#64748b' },
    marginRow: { flexDirection: 'row', gap: 4, alignItems: 'center',  justifyContent: 'flex-end', borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 8 },
    marginLabel: { fontSize: 12, color: '#64748b' },
    marginValue: { fontSize: 12, fontWeight: '600' },
    positive: { color: '#16a34a' },
    negative: { color: '#dc2626' },
});
