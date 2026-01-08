import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { useStockMovementReport, DateRange } from "../../hooks/useReports";

export function StockMovementScreen() {
    const navigation = useNavigation();
    
    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useStockMovementReport(dateRange);

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.itemName}>{item.item_name}</Text>
            </View>
            <View style={styles.statsRow}>
                <View style={[styles.stat, styles.inStat]}>
                    <Text style={styles.statLabel}>In</Text>
                    <Text style={styles.statValue}>+{item.in_qty}</Text>
                </View>
                 <View style={[styles.stat, styles.outStat]}>
                    <Text style={styles.statLabel}>Out</Text>
                    <Text style={styles.statValue}>-{item.out_qty}</Text>
                </View>
                <View style={[styles.stat, styles.netStat]}>
                    <Text style={styles.statLabel}>Net</Text>
                    <Text style={[styles.statValue, { color: item.in_qty - item.out_qty >= 0 ? '#16a34a' : '#dc2626' }]}>
                        {item.in_qty - item.out_qty > 0 ? '+' : ''}{item.in_qty - item.out_qty}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
             <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Stock Movement</Text>
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
                         ListEmptyComponent={<Text style={styles.emptyText}>No movement found in this period.</Text>}
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
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, borderBottomWidth: 1, borderColor: '#f1f5f9', paddingBottom: 8 },
    itemName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    stat: { alignItems: 'center', flex: 1 },
    inStat: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 8, marginRight: 8 },
    outStat: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 8, marginRight: 8 },
    netStat: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 8 },
    statLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
});
