import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react-native";
import { useProfitLossReport, DateRange } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

export function ProfitLossScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

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
                    <ArrowLeft color={colors.text} size={24} />
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
                            <Text style={[styles.mainValue, { color: data.netProfit >= 0 ? colors.success : colors.danger }]}>
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
                                <Text style={[styles.sectionTotal, { color: colors.danger }]}>({formatCurrency(data.cogs.total)})</Text>
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
                                <Text style={[styles.sectionTotal, { color: colors.danger }]}>({formatCurrency(data.expenses.total)})</Text>
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
                            <Text style={[styles.totalValue, { color: data.netProfit >= 0 ? colors.success : colors.danger }]}>
                                {formatCurrency(data.netProfit)}
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, marginTop: Platform.OS === 'android' ? 24 : 0 },
    iconBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
    content: { padding: 16, paddingBottom: 40 },
    dateDisplay: { alignItems: 'center', marginBottom: 20 },
    dateText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    loadingText: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
    mainCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    mainLabel: { fontSize: 14, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    mainValue: { fontSize: 32, fontWeight: '700', marginBottom: 4 },
    subText: { fontSize: 13, color: colors.textMuted },
    section: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderColor: colors.border, paddingBottom: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    sectionTotal: { fontSize: 15, fontWeight: '600', color: colors.text },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    rowLabel: { fontSize: 14, color: colors.textSecondary },
    rowValue: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    emptyText: { textAlign: 'center', color: colors.border, fontSize: 13, fontStyle: 'italic' },
    summaryLine: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: colors.surfaceHover, borderRadius: 12, marginBottom: 16 },
    summaryLabel: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
    summaryValue: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
    totalLine: { backgroundColor: colors.text },
    totalLabel: { fontSize: 16, fontWeight: '700', color: colors.background },
    totalValue: { fontSize: 18, fontWeight: '700' }
});
