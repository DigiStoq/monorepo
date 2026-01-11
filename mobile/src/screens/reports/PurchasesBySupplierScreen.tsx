import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Calendar } from "lucide-react-native";
import { usePurchasesBySupplierReport, DateRange } from "../../hooks/useReports";
import { CustomHeader } from "../../components/CustomHeader";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

export function PurchasesBySupplierScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = usePurchasesBySupplierReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Text style={styles.name}>{item.supplier_name}</Text>
                <Text style={styles.amount}>{formatCurrency(item.total_amount)}</Text>
            </View>
            <Text style={styles.count}>{item.invoice_count} invoices</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <CustomHeader title="Purchase By Supplier" />

            <View style={styles.content}>
                <View style={styles.dateDisplay}>
                    <Calendar color={colors.textMuted} size={16} style={{ marginRight: 6 }} />
                    <Text style={styles.dateText}>{dateRange.from} - {dateRange.to}</Text>
                </View>

                {isLoading ? (
                    <Text style={styles.loadingText}>Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.supplier_id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No purchases found.</Text>}
                    />
                )}
            </View>
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    dateDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, backgroundColor: colors.surfaceHover },
    dateText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
    list: { padding: spacing.lg, gap: spacing.md },
    loadingText: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
    emptyText: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
    card: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
    amount: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
    count: { fontSize: fontSize.sm, color: colors.textMuted },
});
