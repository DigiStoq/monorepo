import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, TrendingUp, TrendingDown, ArrowRight, Wallet } from "lucide-react-native";
import { useCashFlowReport, DateRange } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

export function CashFlowScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

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
                    <ArrowLeft color={colors.text} size={24} />
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
                                <Wallet color={colors.primary} size={24} />
                            </View>
                            <Text style={styles.mainLabel}>Net Cash Flow</Text>
                            <Text style={[styles.mainValue, { color: data.netCashFlow >= 0 ? colors.primary : colors.danger }]}>
                                {data.netCashFlow >= 0 ? '+' : ''}{formatCurrency(data.netCashFlow)}
                            </Text>
                            <Text style={styles.subText}>
                                {data.netCashFlow >= 0 ? 'Surplus' : 'Deficit'} for this period
                            </Text>
                        </View>

                        <View style={styles.rowContainer}>
                            {/* Inflows Summary */}
                            <View style={[styles.summaryBox, { backgroundColor: colors.success + '10', borderColor: colors.success + '30' }]}>
                                <View style={styles.boxHeader}>
                                    <Text style={[styles.boxTitle, { color: colors.success }]}>Inflows</Text>
                                    <TrendingUp size={16} color={colors.success} />
                                </View>
                                <Text style={[styles.boxValue, { color: colors.success }]}>{formatCurrency(data.inflows.total)}</Text>
                            </View>

                            {/* Outflows Summary */}
                            <View style={[styles.summaryBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
                                <View style={styles.boxHeader}>
                                    <Text style={[styles.boxTitle, { color: colors.danger }]}>Outflows</Text>
                                    <TrendingDown size={16} color={colors.danger} />
                                </View>
                                <Text style={[styles.boxValue, { color: colors.danger }]}>{formatCurrency(data.outflows.total)}</Text>
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
                                        <View style={[styles.bullet, { backgroundColor: colors.success }]} />
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
                                        <View style={[styles.bullet, { backgroundColor: colors.danger }]} />
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
    iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '10', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    mainLabel: { fontSize: 14, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    mainValue: { fontSize: 32, fontWeight: '700', marginBottom: 4 },
    subText: { fontSize: 13, color: colors.textMuted },

    rowContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    summaryBox: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1 },
    boxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    boxTitle: { fontSize: 13, fontWeight: '600' },
    boxValue: { fontSize: 18, fontWeight: '700' },

    section: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    sectionHeader: { marginBottom: 16, borderBottomWidth: 1, borderColor: colors.border, paddingBottom: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bullet: { width: 8, height: 8, borderRadius: 4 },
    rowLabel: { fontSize: 14, color: colors.textSecondary },
    rowValue: { fontSize: 14, color: colors.text, fontWeight: '500' },
    emptyText: { textAlign: 'center', color: colors.border, fontSize: 13, fontStyle: 'italic' },
});
