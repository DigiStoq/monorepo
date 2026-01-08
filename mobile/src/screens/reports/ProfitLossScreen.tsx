import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react-native";
import { useProfitLossReport, DateRange } from "../../hooks/useReports";

export function ProfitLossScreen() {
    const navigation = useNavigation();
    
    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useProfitLossReport(dateRange);

    const formatCurrency = (amount: number) => "$" + (amount || 0).toFixed(2);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profit & Loss</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.dateDisplay}>
                    <Text style={styles.dateText}>{dateRange.from} - {dateRange.to}</Text>
                </View>

                {isLoading ? (
                    <Text style={styles.loadingText}>Loading data...</Text>
                ) : !data ? (
                    <Text style={styles.loadingText}>No data available</Text>
                ) : (
                    <>
                        {/* Net Profit Big Card */}
                        <View style={styles.mainCard}>
                            <Text style={styles.mainLabel}>Net Profit</Text>
                            <Text style={[styles.mainValue, { color: data.netProfit >= 0 ? '#16a34a' : '#dc2626' }]}>
                                {formatCurrency(data.netProfit)}
                            </Text>
                            <Text style={styles.subText}>
                                {data.netProfit >= 0 ? 'Profit' : 'Loss'} for this period
                            </Text>
                        </View>

                        {/* Revenue Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Revenue</Text>
                                <Text style={styles.sectionTotal}>{formatCurrency(data.revenue.total)}</Text>
                            </View>
                            {data.revenue.breakdown.map((item, i) => (
                                <View key={i} style={styles.row}>
                                    <Text style={styles.rowLabel}>{item.category}</Text>
                                    <Text style={styles.rowValue}>{formatCurrency(item.amount)}</Text>
                                </View>
                            ))}
                        </View>

                        {/* COGS Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Cost of Goods Sold</Text>
                                <Text style={[styles.sectionTotal, {color: '#dc2626'}]}>({formatCurrency(data.cogs.total)})</Text>
                            </View>
                            {data.cogs.breakdown.map((item, i) => (
                                <View key={i} style={styles.row}>
                                    <Text style={styles.rowLabel}>{item.category}</Text>
                                    <Text style={styles.rowValue}>{formatCurrency(item.amount)}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Gross Profit Line */}
                        <View style={styles.summaryLine}>
                            <Text style={styles.summaryLabel}>Gross Profit</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(data.grossProfit)}</Text>
                        </View>
                        
                        {/* Expenses Section */}
                         <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Operating Expenses</Text>
                                <Text style={[styles.sectionTotal, {color: '#dc2626'}]}>({formatCurrency(data.expenses.total)})</Text>
                            </View>
                            {data.expenses.breakdown.length === 0 && <Text style={styles.emptyText}>No expenses recorded</Text>}
                            {data.expenses.breakdown.map((item, i) => (
                                <View key={i} style={styles.row}>
                                    <Text style={styles.rowLabel}>{item.category}</Text>
                                    <Text style={styles.rowValue}>{formatCurrency(item.amount)}</Text>
                                </View>
                            ))}
                        </View>
                        
                        {/* Net Profit Line */}
                        <View style={[styles.summaryLine, styles.totalLine]}>
                            <Text style={styles.totalLabel}>Net Profit</Text>
                            <Text style={[styles.totalValue, { color: data.netProfit >= 0 ? '#16a34a' : '#dc2626' }]}>
                                {formatCurrency(data.netProfit)}
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderColor: "#e2e8f0", marginTop: Platform.OS === 'android' ? 24 : 0 },
    iconBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: "#0f172a" },
    content: { padding: 16, paddingBottom: 40 },
    dateDisplay: { alignItems: 'center', marginBottom: 20 },
    dateText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    loadingText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
    mainCard: { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    mainLabel: { fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    mainValue: { fontSize: 32, fontWeight: '700', marginBottom: 4 },
    subText: { fontSize: 13, color: '#94a3b8' },
    section: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderColor: '#f1f5f9', paddingBottom: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
    sectionTotal: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    rowLabel: { fontSize: 14, color: '#334155' },
    rowValue: { fontSize: 14, color: '#334155', fontWeight: '500' },
    emptyText: { textAlign: 'center', color: '#cbd5e1', fontSize: 13, fontStyle: 'italic' },
    summaryLine: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#f1f5f9', borderRadius: 12, marginBottom: 16 },
    summaryLabel: { fontSize: 15, fontWeight: '600', color: '#334155' },
    summaryValue: { fontSize: 15, fontWeight: '700', color: '#334155' },
    totalLine: { backgroundColor: '#0f172a' },
    totalLabel: { fontSize: 16, fontWeight: '700', color: 'white' },
    totalValue: { fontSize: 18, fontWeight: '700' }
});
