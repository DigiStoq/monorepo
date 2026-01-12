import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar, FileText } from "lucide-react-native";
import { useTaxSummaryReport, DateRange } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

export function TaxSummaryScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useTaxSummaryReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tax Summary</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Calendar color={colors.textSecondary} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.dateDisplay}>
                    <Text style={styles.dateText}>{dateRange.from} - {dateRange.to}</Text>
                </View>

                {isLoading ? (
                    <Text style={styles.loadingText}>Loading...</Text>
                ) : !data ? (
                    <Text style={styles.loadingText}>No tax data.</Text>
                ) : (
                    <>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Tax Collected (Output)</Text>
                            <Text style={styles.subtitle}>From Sales</Text>
                            <Text style={[styles.amount, styles.pos]}>+{formatCurrency(data.taxCollected)}</Text>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Tax Paid (Input)</Text>
                            <Text style={styles.subtitle}>From Purchases</Text>
                            <Text style={[styles.amount, styles.neg]}>-{formatCurrency(data.taxPaid)}</Text>
                        </View>

                        <View style={[styles.card, styles.netCard]}>
                            <Text style={styles.cardTitle}>Net Tax Payable</Text>
                            <Text style={[styles.amount, data.netTax >= 0 ? styles.pos : styles.neg]}>
                                {formatCurrency(data.netTax)}
                            </Text>
                            <Text style={styles.note}>
                                {data.netTax > 0 ? "You owe this amount to tax authority." : "You have a tax credit."}
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
    content: { padding: 16, gap: 16 },
    dateDisplay: { alignItems: 'center', marginBottom: 8 },
    dateText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    loadingText: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
    card: { backgroundColor: colors.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    netCard: { borderColor: colors.primary, backgroundColor: colors.primary + '10' }, // Use primary with opacity
    cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
    subtitle: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
    amount: { fontSize: 32, fontWeight: '700' },
    pos: { color: colors.success },
    neg: { color: colors.danger },
    note: { fontSize: 12, color: colors.primary, marginTop: 8 },
});
