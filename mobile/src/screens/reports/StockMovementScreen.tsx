import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { useStockMovementReport, DateRange } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

export function StockMovementScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useStockMovementReport(dateRange);

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.itemName}>{item.item_name}</Text>
            </View>
            <View style={styles.statsRow}>
                <View style={[styles.stat, styles.inStat]}>
                    <Text style={styles.statLabel}>In</Text>
                    <Text style={styles.statValue}>+{item.in_qty}</Text>
                </View>
                <View style={[styles.stat, styles.outStat]}>
                    <Text style={styles.statLabel}>Out</Text>
                    <Text style={styles.statValue}>-{item.out_qty}</Text>
                </View>
                <View style={[styles.stat, styles.netStat]}>
                    <Text style={styles.statLabel}>Net</Text>
                    <Text style={[styles.statValue, { color: item.in_qty - item.out_qty >= 0 ? colors.success : colors.danger }]}>
                        {item.in_qty - item.out_qty > 0 ? '+' : ''}{item.in_qty - item.out_qty}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Stock Movement</Text>
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
                        ListEmptyComponent={<Text style={styles.emptyText}>No movement found in this period.</Text>}
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
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, borderBottomWidth: 1, borderColor: colors.borderLight, paddingBottom: 8 },
    itemName: { fontSize: 16, fontWeight: '600', color: colors.text },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    stat: { alignItems: 'center', flex: 1 },
    inStat: { backgroundColor: colors.success + '10', borderRadius: 8, padding: 8, marginRight: 8 },
    outStat: { backgroundColor: colors.danger + '10', borderRadius: 8, padding: 8, marginRight: 8 },
    netStat: { backgroundColor: colors.surfaceHover, borderRadius: 8, padding: 8 },
    statLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: '700', color: colors.text },
});
