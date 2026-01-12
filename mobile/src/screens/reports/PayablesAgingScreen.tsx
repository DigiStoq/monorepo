import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, CheckCircle } from "lucide-react-native";
import { usePayablesAgingReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

export function PayablesAgingScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { report, isLoading } = usePayablesAgingReport();

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const bucketsOrder = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payables Aging</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {isLoading ? (
                    <Text style={styles.loadingText}>Loading data...</Text>
                ) : !report || report.totalDue === 0 ? (
                    <View style={styles.emptyState}>
                        <CheckCircle size={48} color={colors.success} />
                        <Text style={styles.emptyText}>No pending bills.</Text>
                        <Text style={styles.subText}>You are all settled up with suppliers.</Text>
                    </View>
                ) : (
                    <>
                        {/* High Level Summary */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Total Payable</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(report.totalDue)}</Text>
                        </View>

                        {/* Buckets */}
                        <View style={styles.bucketsContainer}>
                            {bucketsOrder.map(range => {
                                const bucket = report.buckets.find(b => b.range === range);
                                const amount = bucket ? bucket.amount : 0;
                                const isHigh = amount > 0 && range !== 'Current';
                                return (
                                    <View key={range} style={styles.bucketCard}>
                                        <Text style={styles.bucketLabel}>{range}</Text>
                                        <Text style={[styles.bucketValue, isHigh && { color: colors.danger }]}>
                                            {formatCurrency(amount)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Supplier Breakdown */}
                        <Text style={styles.sectionTitle}>Supplier Breakdown</Text>
                        {report.customers.map(customer => (
                            <View key={customer.id} style={styles.customerCard}>
                                <View style={styles.customerHeader}>
                                    <Text style={styles.customerName}>{customer.name}</Text>
                                    <Text style={styles.customerTotal}>{formatCurrency(customer.totalDue)}</Text>
                                </View>
                                <View style={styles.customerBuckets}>
                                    {bucketsOrder.map(range => {
                                        const bucket = customer.buckets.find(b => b.range === range);
                                        if (!bucket || bucket.amount === 0) return null;
                                        return (
                                            <View key={range} style={styles.miniBucket}>
                                                <Text style={styles.miniLabel}>{range}</Text>
                                                <Text style={[styles.miniValue]}>
                                                    {formatCurrency(bucket.amount)}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
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
    loadingText: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
    summaryCard: { backgroundColor: colors.surface, padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    summaryLabel: { fontSize: 14, color: colors.textMuted, marginBottom: 4 },
    summaryValue: { fontSize: 32, fontWeight: '700', color: colors.danger },
    bucketsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    bucketCard: { width: '48%', backgroundColor: colors.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    bucketLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
    bucketValue: { fontSize: 16, fontWeight: '600', color: colors.text },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
    customerCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    customerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    customerName: { fontSize: 16, fontWeight: '600', color: colors.text },
    customerTotal: { fontSize: 16, fontWeight: '700', color: colors.text },
    customerBuckets: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    miniBucket: { backgroundColor: colors.surfaceHover, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    miniLabel: { fontSize: 10, color: colors.textMuted },
    miniValue: { fontSize: 12, fontWeight: '600', color: colors.text },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 18, fontWeight: '600', color: colors.textSecondary, marginTop: 16 },
    subText: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
});
