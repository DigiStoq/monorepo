import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { useDayBookReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

export function DayBookScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Default to today
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { data, isLoading } = useDayBookReport(date);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const getTypeStyleKey = (type: string) => {
        switch (type) {
            case 'Sale': return 'sale';
            case 'Purchase': return 'purchase';
            case 'Payment In': return 'payIn';
            case 'Payment Out': return 'payOut';
            case 'Expense': return 'expense';
            default: return 'other';
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.leftCol}>
                <View style={[styles.badge, styles[getTypeStyleKey(item.type)]]}>
                    <Text style={styles.badgeText}>{item.type}</Text>
                </View>
                <Text style={styles.desc}>{item.description || 'No Description'}</Text>
            </View>
            <View style={styles.rightCol}>
                {item.amount_in > 0 && <Text style={styles.in}>+{formatCurrency(item.amount_in)}</Text>}
                {item.amount_out > 0 && <Text style={styles.out}>-{formatCurrency(item.amount_out)}</Text>}
            </View>
        </View>
    );

    const totalIn = data ? data.reduce((sum, item) => sum + item.amount_in, 0) : 0;
    const totalOut = data ? data.reduce((sum, item) => sum + item.amount_out, 0) : 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Day Book</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Calendar color={colors.textSecondary} size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.dateDisplay}>
                    <Text style={styles.dateText}>Date: {date}</Text>
                </View>

                {/* Summary for Day */}
                <View style={styles.summaryBar}>
                    <View style={styles.sumItem}>
                        <Text style={styles.sumLabel}>Total In</Text>
                        <Text style={[styles.sumValue, styles.in]}>{formatCurrency(totalIn)}</Text>
                    </View>
                    <View style={styles.sumItem}>
                        <Text style={styles.sumLabel}>Total Out</Text>
                        <Text style={[styles.sumValue, styles.out]}>{formatCurrency(totalOut)}</Text>
                    </View>
                    <View style={styles.sumItem}>
                        <Text style={styles.sumLabel}>Net</Text>
                        <Text style={styles.sumValue}>{formatCurrency(totalIn - totalOut)}</Text>
                    </View>
                </View>

                {isLoading ? (
                    <Text style={styles.loadingText}>Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No transactions for this date.</Text>}
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
    summaryBar: { flexDirection: 'row', backgroundColor: colors.surface, padding: 16, borderBottomWidth: 1, borderColor: colors.border },
    sumItem: { flex: 1, alignItems: 'center' },
    sumLabel: { fontSize: 12, color: colors.textSecondary },
    sumValue: { fontSize: 16, fontWeight: '700', color: colors.text },
    list: { padding: 16, gap: 12 },
    loadingText: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
    emptyText: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
    card: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    leftCol: { gap: 4 },
    rightCol: { alignItems: 'flex-end' },
    desc: { fontSize: 14, color: colors.textSecondary },
    in: { color: colors.success, fontWeight: '600' },
    out: { color: colors.danger, fontWeight: '600' },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    sale: { backgroundColor: colors.primary },
    purchase: { backgroundColor: colors.warning },
    payIn: { backgroundColor: colors.success },
    payOut: { backgroundColor: colors.danger },
    expense: { backgroundColor: colors.info },
    other: { backgroundColor: colors.textMuted },
});
