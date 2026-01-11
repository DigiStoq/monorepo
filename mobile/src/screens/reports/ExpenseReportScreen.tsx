import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar, FileText } from "lucide-react-native";
import { useExpenseReport, DateRange } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

export function ExpenseReportScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useExpenseReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Text style={styles.category}>{item.category || "Uncategorized"}</Text>
                <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            </View>
            <Text style={styles.count}>{item.count} transactions</Text>
        </View>
    );

    const total = data ? data.reduce((sum, item) => sum + item.amount, 0) : 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Expense Report</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Calendar color={colors.textSecondary} size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.dateDisplay}>
                    <Text style={styles.dateText}>{dateRange.from} - {dateRange.to}</Text>
                </View>

                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Total Expenses</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
                </View>

                {isLoading ? (
                    <Text style={styles.loadingText}>Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.category}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No expenses found.</Text>}
                    />
                )}
            </View>
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, marginTop: Platform.OS === 'android' ? 24 : 0 },
    iconBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
    content: { flex: 1 },
    dateDisplay: { alignItems: 'center', padding: 12, backgroundColor: colors.surfaceHover },
    dateText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    summaryBox: { padding: 16, backgroundColor: colors.surface, alignItems: 'center', borderBottomWidth: 1, borderColor: colors.border },
    summaryLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    summaryValue: { fontSize: 24, fontWeight: '700', color: colors.danger },
    list: { padding: 16, gap: 12 },
    loadingText: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
    emptyText: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
    card: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    category: { fontSize: 16, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
    amount: { fontSize: 16, fontWeight: '600', color: colors.text },
    count: { fontSize: 12, color: colors.textSecondary },
});
