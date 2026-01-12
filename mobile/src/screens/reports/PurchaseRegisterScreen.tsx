import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar, FileText } from "lucide-react-native";
import { usePurchaseRegisterReport, DateRange } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

export function PurchaseRegisterScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = usePurchaseRegisterReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return { backgroundColor: colors.success + '20', color: colors.success };
            case 'partial': return { backgroundColor: colors.warning + '20', color: colors.warning };
            case 'sent': return { backgroundColor: colors.primary + '20', color: colors.primary };
            case 'cancelled': return { backgroundColor: colors.danger + '20', color: colors.danger };
            default: return { backgroundColor: colors.surfaceHover, color: colors.textSecondary };
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const { backgroundColor, color } = getStatusStyle(item.status);
        return (
            <TouchableOpacity style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.invoiceNum}>{item.invoice_number}</Text>
                        <Text style={styles.date}>{item.date}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor }]}>
                        <Text style={[styles.badgeText, { color }]}>{item.status}</Text>
                    </View>
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.customer}>{item.customer_name}</Text>
                    <Text style={styles.total}>{formatCurrency(item.total)}</Text>
                </View>
                <View style={styles.cardFooter}>
                    <Text style={styles.footerText}>Paid: {formatCurrency(item.amount_paid)}</Text>
                    {item.amount_due > 0 && <Text style={styles.dueText}>Due: {formatCurrency(item.amount_due)}</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Purchase Register</Text>
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
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No purchases found in this period.</Text>}
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
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    invoiceNum: { fontSize: 16, fontWeight: '600', color: colors.text },
    date: { fontSize: 12, color: colors.textMuted },
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    customer: { fontSize: 14, color: colors.textSecondary },
    total: { fontSize: 16, fontWeight: '700', color: colors.text },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.borderLight, paddingTop: 8 },
    footerText: { fontSize: 12, color: colors.success },
    dueText: { fontSize: 12, color: colors.danger },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
});
