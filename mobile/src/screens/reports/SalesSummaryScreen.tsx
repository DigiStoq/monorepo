import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar, DollarSign, FileText, TrendingUp, TrendingDown, Users, Package } from "lucide-react-native";
import { useSalesSummaryReport, DateRange } from "../../hooks/useReports";

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
    return <View style={[styles.card, style]}>{children}</View>;
}

export function SalesSummaryScreen() {
    const navigation = useNavigation();
    
    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { summary, isLoading } = useSalesSummaryReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    // Derived stats
    const collectionPercent = summary && summary.totalSales > 0 
        ? ((summary.totalPaid / summary.totalSales) * 100).toFixed(1) 
        : "0";
    
    const outstandingPercent = summary && summary.totalSales > 0
        ? ((summary.totalDue / summary.totalSales) * 100).toFixed(1)
        : "0";

    // Chart helpers
    const maxMonthAmount = summary?.salesByMonth.reduce((max, m) => Math.max(max, m.amount), 0) || 1;
    const maxCustomerAmount = summary?.topCustomers.reduce((max, c) => Math.max(max, c.amount), 0) || 1;
    const maxItemAmount = summary?.topItems.reduce((max, i) => Math.max(max, i.amount), 0) || 1;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sales Summary</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Calendar color="#64748b" size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Date Display */}
                <View style={styles.dateDisplay}>
                    <Text style={styles.dateText}>{dateRange.from} - {dateRange.to}</Text>
                </View>

                {isLoading ? (
                    <Text style={styles.loadingText}>Loading data...</Text>
                ) : !summary ? (
                    <Text style={styles.loadingText}>No data found.</Text>
                ) : (
                    <>
                        {/* Summary Grid */}
                        <View style={styles.grid}>
                             {/* Total Sales */}
                            <Card style={styles.summaryCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardLabel}>Total Sales</Text>
                                    <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                                        <DollarSign size={16} color="#15803d" />
                                    </View>
                                </View>
                                <Text style={styles.bigValue}>{formatCurrency(summary.totalSales)}</Text>
                                <Text style={styles.subText}>{summary.totalInvoices} invoices</Text>
                            </Card>

                            {/* Total Due */}
                             <Card style={styles.summaryCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardLabel}>Amount Due</Text>
                                    <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                                        <TrendingDown size={16} color="#dc2626" />
                                    </View>
                                </View>
                                <Text style={[styles.bigValue, { color: '#dc2626' }]}>{formatCurrency(summary.totalDue)}</Text>
                                <Text style={styles.subText}>{outstandingPercent}% outstanding</Text>
                            </Card>
                        </View>

                         <View style={styles.grid}>
                             {/* Total Paid */}
                            <Card style={styles.summaryCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardLabel}>Received</Text>
                                    <View style={[styles.iconBox, { backgroundColor: '#ccfbf1' }]}>
                                        <TrendingUp size={16} color="#0f766e" />
                                    </View>
                                </View>
                                <Text style={[styles.bigValue, { color: '#16a34a' }]}>{formatCurrency(summary.totalPaid)}</Text>
                                <Text style={styles.subText}>{collectionPercent}% collected</Text>
                            </Card>

                             {/* Avg Order */}
                             <Card style={styles.summaryCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardLabel}>Avg Order</Text>
                                    <View style={[styles.iconBox, { backgroundColor: '#dbeafe' }]}>
                                        <FileText size={16} color="#1d4ed8" />
                                    </View>
                                </View>
                                <Text style={styles.bigValue}>{formatCurrency(summary.averageOrderValue)}</Text>
                                <Text style={styles.subText}>Per invoice</Text>
                            </Card>
                        </View>

                        {/* Monthly Trend */}
                        <Card style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Sales Trend</Text>
                            <View style={styles.chartContainer}>
                                {summary.salesByMonth.length === 0 ? <Text style={styles.noData}>No trend data</Text> : 
                                 summary.salesByMonth.map((m, i) => (
                                    <View key={i} style={styles.barGroup}>
                                        <View style={[styles.bar, { height: Math.max(4, (m.amount / maxMonthAmount) * 100) }]} />
                                        <Text style={styles.barLabel}>{m.month}</Text>
                                    </View>
                                ))}
                            </View>
                        </Card>

                        {/* Top Customers */}
                         <Card style={styles.sectionCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.sectionTitle}>Top Customers</Text>
                                <Users size={16} color="#94a3b8" />
                            </View>
                            <View style={styles.list}>
                                {summary.topCustomers.length === 0 ? <Text style={styles.noData}>No customers found</Text> :
                                summary.topCustomers.map((c, i) => (
                                    <View key={c.customerId} style={styles.listItem}>
                                        <View style={styles.listRow}>
                                             <Text style={styles.listName}>{i+1}. {c.customerName}</Text>
                                             <Text style={styles.listValue}>{formatCurrency(c.amount)}</Text>
                                        </View>
                                        <View style={styles.progressBarBg}>
                                            <View style={[styles.progressBarFill, { width: `${(c.amount / maxCustomerAmount) * 100}%` }]} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </Card>

                        {/* Top Items */}
                        <Card style={styles.sectionCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.sectionTitle}>Top Selling Items</Text>
                                <Package size={16} color="#94a3b8" />
                            </View>
                             <View style={styles.list}>
                                {summary.topItems.length === 0 ? <Text style={styles.noData}>No items sold</Text> :
                                summary.topItems.map((item, i) => (
                                    <View key={item.itemId} style={styles.listItem}>
                                        <View style={styles.listRow}>
                                             <Text style={styles.listName}>{i+1}. {item.itemName}</Text>
                                             <Text style={styles.listValue}>{formatCurrency(item.amount)}</Text>
                                        </View>
                                        <Text style={styles.subText}>{item.quantity} sold</Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
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
    dateDisplay: { alignItems: 'center', marginBottom: 16 },
    dateText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    loadingText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
    grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    card: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16 },
    summaryCard: { flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    iconBox: { padding: 6, borderRadius: 8 },
    bigValue: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
    subText: { fontSize: 11, color: '#94a3b8' },
    sectionCard: { marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
    chartContainer: { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: 8, paddingTop: 10 },
    barGroup: { flex: 1, alignItems: 'center', gap: 4 },
    bar: { width: 12, backgroundColor: '#6366f1', borderRadius: 4 },
    barLabel: { fontSize: 10, color: '#64748b' },
    list: { gap: 12 },
    listItem: { gap: 6 },
    listRow: { flexDirection: 'row', justifyContent: 'space-between' },
    listName: { fontSize: 14, color: '#334155', fontWeight: '500', flex: 1 },
    listValue: { fontSize: 14, color: '#0f172a', fontWeight: '600' },
    progressBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },
    noData: { textAlign: 'center', color: '#cbd5e1', padding: 20 },
});
