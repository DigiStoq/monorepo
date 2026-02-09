import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { useItemProfitabilityReport, DateRange } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

export function ItemProfitabilityScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useItemProfitabilityReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => {
        const margin = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : "0";
        return (
            <View style={styles.card}>
                <View style={styles.cardRow}>
                    <Text style={styles.name}>{item.item_name}</Text>
                    <Text style={[styles.profit, item.profit >= 0 ? styles.positive : styles.negative]}>
                        {formatCurrency(item.profit)}
                    </Text>
                </View>
                <View style={styles.detailsRow}>
                    <Text style={styles.detail}>Sold: {item.quantity_sold}</Text>
                    <Text style={styles.detail}>Rev: {formatCurrency(item.revenue)}</Text>
                    <Text style={styles.detail}>Cost: {formatCurrency(item.cost)}</Text>
                </View>
                <View style={styles.marginRow}>
                    <Text style={styles.marginLabel}>Margin:</Text>
                    <Text style={[styles.marginValue, item.profit >= 0 ? styles.positive : styles.negative]}>
                        {margin}%
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Item Profitability</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Calendar color={colors.textSecondary} size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.dateDisplay}>
                    <Text style={styles.dateText}>{dateRange.from} - {dateRange.to}</Text>
                </View>

                {isLoading ? (
                    <Text style={styles.loadingText}>Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.item_id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No sales data available.</Text>}
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
    list: { padding: 16, gap: 12 },
    loadingText: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
    emptyText: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
    card: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    name: { fontSize: 16, fontWeight: '600', color: colors.text },
    profit: { fontSize: 16, fontWeight: '700' },
    detailsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    detail: { fontSize: 12, color: colors.textSecondary },
    marginRow: { flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'flex-end', borderTopWidth: 1, borderColor: colors.borderLight, paddingTop: 8 },
    marginLabel: { fontSize: 12, color: colors.textSecondary },
    marginValue: { fontSize: 12, fontWeight: '600' },
    positive: { color: colors.success },
    negative: { color: colors.danger },
});
