import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Calendar, DollarSign, FileText, TrendingUp, TrendingDown, Users, Package } from "lucide-react-native";
import { useSalesSummaryReport, DateRange } from "../../hooks/useReports";
import { CustomHeader } from "../../components/CustomHeader";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

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
            <CustomHeader />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Date Display */}
                <View style={styles.dateDisplay}>
                    <Calendar color={colors.textMuted} size={16} style={{marginRight: 6}} />
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
                                    <View style={[styles.iconBox, { backgroundColor: colors.successMuted }]}>
                                        <DollarSign size={16} color={colors.success} />
                                    </View>
                                </View>
                                <Text style={styles.bigValue}>{formatCurrency(summary.totalSales)}</Text>
                                <Text style={styles.subText}>{summary.totalInvoices} invoices</Text>
                            </Card>

                            {/* Total Due */}
                             <Card style={styles.summaryCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardLabel}>Amount Due</Text>
                                    <View style={[styles.iconBox, { backgroundColor: colors.dangerMuted }]}>
                                        <TrendingDown size={16} color={colors.danger} />
                                    </View>
                                </View>
                                <Text style={[styles.bigValue, { color: colors.danger }]}>{formatCurrency(summary.totalDue)}</Text>
                                <Text style={styles.subText}>{outstandingPercent}% outstanding</Text>
                            </Card>
                        </View>

                         <View style={styles.grid}>
                             {/* Total Paid */}
                            <Card style={styles.summaryCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardLabel}>Received</Text>
                                    <View style={[styles.iconBox, { backgroundColor: colors.infoMuted }]}>
                                        <TrendingUp size={16} color={colors.info} />
                                    </View>
                                </View>
                                <Text style={[styles.bigValue, { color: colors.success }]}>{formatCurrency(summary.totalPaid)}</Text>
                                <Text style={styles.subText}>{collectionPercent}% collected</Text>
                            </Card>

                             {/* Avg Order */}
                             <Card style={styles.summaryCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardLabel}>Avg Order</Text>
                                    <View style={[styles.iconBox, { backgroundColor: colors.primaryMuted }]}>
                                        <FileText size={16} color={colors.primary} />
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
                                <Users size={16} color={colors.textMuted} />
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
                                <Package size={16} color={colors.textMuted} />
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
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: 40 },
    dateDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, padding: spacing.sm, backgroundColor: colors.surfaceHover, borderRadius: borderRadius.md, alignSelf: 'center' },
    dateText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
    loadingText: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
    grid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, padding: spacing.md, ...shadows.sm },
    summaryCard: { flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    cardLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
    iconBox: { padding: 6, borderRadius: borderRadius.sm },
    bigValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: 2 },
    subText: { fontSize: 10, color: colors.textMuted },
    sectionCard: { marginBottom: spacing.md },
    sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: spacing.sm },
    chartContainer: { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: spacing.sm, paddingTop: 10 },
    barGroup: { flex: 1, alignItems: 'center', gap: 4 },
    bar: { width: 12, backgroundColor: colors.accent, borderRadius: 4 },
    barLabel: { fontSize: 10, color: colors.textMuted },
    list: { gap: spacing.sm },
    listItem: { gap: 4 },
    listRow: { flexDirection: 'row', justifyContent: 'space-between' },
    listName: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium, flex: 1 },
    listValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.bold },
    progressBarBg: { height: 6, backgroundColor: colors.surfaceHover, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
    noData: { textAlign: 'center', color: colors.textMuted, padding: 20 },
});
