import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, TrendingUp, TrendingDown, ArrowRight, Wallet } from "lucide-react-native";
import { useCashFlowReport, DateRange } from "../../hooks/useReports";

export function CashFlowScreen() {
    const navigation = useNavigation();
    
    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useCashFlowReport(dateRange);

    const formatCurrency = (amount: number) => "$" + (amount || 0).toFixed(2);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cash Flow Statement</Text>
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
                        {/* Net Cash Flow Card */}
                        <View style={styles.mainCard}>
                             <View style={styles.iconCircle}>
                                <Wallet color="#0f766e" size={24} />
                             </View>
                            <Text style={styles.mainLabel}>Net Cash Flow</Text>
                            <Text style={[styles.mainValue, { color: data.netCashFlow >= 0 ? '#0f766e' : '#b91c1c' }]}>
                                {data.netCashFlow >= 0 ? '+' : ''}{formatCurrency(data.netCashFlow)}
                            </Text>
                            <Text style={styles.subText}>
                                {data.netCashFlow >= 0 ? 'Surplus' : 'Deficit'} for this period
                            </Text>
                        </View>

                        <View style={styles.rowContainer}>
                            {/* Inflows Summary */}
                            <View style={[styles.summaryBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                                 <View style={styles.boxHeader}>
                                    <Text style={[styles.boxTitle, { color: '#166534' }]}>Inflows</Text>
                                    <TrendingUp size={16} color="#166534" />
                                 </View>
                                 <Text style={[styles.boxValue, { color: '#166534' }]}>{formatCurrency(data.inflows.total)}</Text>
                            </View>

                            {/* Outflows Summary */}
                            <View style={[styles.summaryBox, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                                 <View style={styles.boxHeader}>
                                    <Text style={[styles.boxTitle, { color: '#991b1b' }]}>Outflows</Text>
                                    <TrendingDown size={16} color="#991b1b" />
                                 </View>
                                 <Text style={[styles.boxValue, { color: '#991b1b' }]}>{formatCurrency(data.outflows.total)}</Text>
                            </View>
                        </View>

                        {/* Inflows Breakdown */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Cash In</Text>
                            </View>
                            {data.inflows.breakdown.length === 0 && <Text style={styles.emptyText}>No inflows recorded</Text>}
                            {data.inflows.breakdown.map((item, i) => (
                                <View key={i} style={styles.row}>
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.bullet, { backgroundColor: '#4ade80' }]} />
                                        <Text style={styles.rowLabel}>{item.category}</Text>
                                    </View>
                                    <Text style={styles.rowValue}>{formatCurrency(item.amount)}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Outflows Breakdown */}
                         <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Cash Out</Text>
                            </View>
                             {data.outflows.breakdown.length === 0 && <Text style={styles.emptyText}>No outflows recorded</Text>}
                            {data.outflows.breakdown.map((item, i) => (
                                <View key={i} style={styles.row}>
                                     <View style={styles.rowLeft}>
                                        <View style={[styles.bullet, { backgroundColor: '#f87171' }]} />
                                        <Text style={styles.rowLabel}>{item.category}</Text>
                                    </View>
                                    <Text style={styles.rowValue}>{formatCurrency(item.amount)}</Text>
                                </View>
                            ))}
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
    iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    mainLabel: { fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    mainValue: { fontSize: 32, fontWeight: '700', marginBottom: 4 },
    subText: { fontSize: 13, color: '#94a3b8' },

    rowContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    summaryBox: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1 },
    boxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    boxTitle: { fontSize: 13, fontWeight: '600' },
    boxValue: { fontSize: 18, fontWeight: '700' },

    section: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    sectionHeader: { marginBottom: 16, borderBottomWidth: 1, borderColor: '#f1f5f9', paddingBottom: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bullet: { width: 8, height: 8, borderRadius: 4 },
    rowLabel: { fontSize: 14, color: '#334155' },
    rowValue: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
    emptyText: { textAlign: 'center', color: '#cbd5e1', fontSize: 13, fontStyle: 'italic' },
});
