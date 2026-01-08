import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { useCashMovementReport, DateRange } from "../../hooks/useReports";

export function CashMovementScreen() {
    const navigation = useNavigation();
    
    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useCashMovementReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.modeName}>{item.mode || 'Unknown Mode'}</Text>
                <Text style={[styles.net, item.net >= 0 ? styles.pos : styles.neg]}>
                    Net: {formatCurrency(item.net)}
                </Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>In:</Text>
                <Text style={styles.valueGreen}>{formatCurrency(item.inAmount)}</Text>
            </View>
             <View style={styles.row}>
                <Text style={styles.label}>Out:</Text>
                <Text style={styles.valueRed}>{formatCurrency(item.outAmount)}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
             <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cash Movement</Text>
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
                        keyExtractor={item => item.mode}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No cash movement found.</Text>}
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
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderColor: '#f1f5f9', paddingBottom: 8 },
    modeName: { fontSize: 16, fontWeight: '600', color: '#0f172a', textTransform: 'capitalize' },
    net: { fontSize: 14, fontWeight: '700' },
    pos: { color: '#16a34a' },
    neg: { color: '#dc2626' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { fontSize: 14, color: '#64748b' },
    valueGreen: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
    valueRed: { fontSize: 14, color: '#dc2626', fontWeight: '600' },
});
