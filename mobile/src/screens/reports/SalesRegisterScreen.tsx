import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar, Search, Filter } from "lucide-react-native";
import { useSalesRegisterReport, DateRange } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

export function SalesRegisterScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>("all");

    const { entries, isLoading } = useSalesRegisterReport(dateRange);

    const filteredData = useMemo(() => {
        return entries.filter((entry) => {
            const matchesSearch =
                (entry.invoiceNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                (entry.customerName || "").toLowerCase().includes(search.toLowerCase());
            const matchesStatus =
                statusFilter === "all" || entry.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [entries, search, statusFilter]);

    const totals = useMemo(() => {
        return filteredData.reduce(
            (acc, entry) => ({
                total: acc.total + (entry.total || 0),
                paid: acc.paid + (entry.paid || 0),
                due: acc.due + (entry.due || 0),
            }),
            { total: 0, paid: 0, due: 0 }
        );
    }, [filteredData]);

    const formatCurrency = (amount: number) => "$" + (amount || 0).toFixed(2);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return colors.success;
            case 'partial': return colors.warning;
            case 'unpaid': return colors.danger;
            default: return colors.textMuted;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sales Register</Text>
                <View style={{ width: 46 }} />
            </View>

            {/* Filters */}
            <View style={styles.filterSection}>
                <View style={styles.searchBox}>
                    <Search size={18} color={colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search invoice or customer..."
                        placeholderTextColor={colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                    {['all', 'paid', 'partial', 'unpaid'].map(s => (
                        <TouchableOpacity
                            key={s}
                            style={[
                                styles.pill,
                                statusFilter === s && styles.pillActive,
                                statusFilter === s && { backgroundColor: getStatusColor(s) === colors.textMuted ? colors.text : getStatusColor(s) }
                            ]}
                            onPress={() => setStatusFilter(s as any)}
                        >
                            <Text style={[styles.pillText, statusFilter === s && styles.pillTextActive]}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.dateRow}>
                    <Text style={styles.dateText}>{dateRange.from} - {dateRange.to}</Text>
                    {/* Date picker trigger would go here */}
                </View>
            </View>

            {/* Summary Strip */}
            <View style={styles.summaryStrip}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Sales</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(totals.total)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Received</Text>
                    <Text style={[styles.summaryValue, { color: colors.success }]}>{formatCurrency(totals.paid)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Due</Text>
                    <Text style={[styles.summaryValue, { color: colors.danger }]}>{formatCurrency(totals.due)}</Text>
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <Text style={styles.invoiceNum}>{item.invoiceNumber}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                    {item.status.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.cardRow}>
                            <Text style={styles.customerName}>{item.customerName}</Text>
                            <Text style={styles.date}>{item.date}</Text>
                        </View>

                        <View style={styles.cardDivider} />

                        <View style={styles.cardRow}>
                            <Text style={styles.amountLabel}>Total</Text>
                            <Text style={styles.amountValue}>{formatCurrency(item.total)}</Text>
                        </View>

                        {(item.due > 0 || item.paid > 0) && (
                            <View style={[styles.cardRow, { marginTop: 4 }]}>
                                <Text style={styles.dueLabel}>
                                    {item.paid > 0 ? `Paid: ${formatCurrency(item.paid)}` : ''}
                                </Text>
                                <Text style={[styles.dueValue, { color: item.due > 0 ? colors.danger : colors.success }]}>
                                    Due: {formatCurrency(item.due)}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>{isLoading ? "Loading..." : "No invoices found"}</Text>
                    </View>
                }
            />
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, marginTop: Platform.OS === 'android' ? 24 : 0 },
    iconBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
    filterSection: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceHover, borderRadius: 8, paddingHorizontal: 10, height: 40, marginBottom: 12 },
    searchInput: { flex: 1, marginLeft: 8, height: '100%', fontSize: 15, color: colors.text },
    pillsScroll: { flexDirection: 'row', marginBottom: 12 },
    pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.surfaceHover, marginRight: 8 },
    pillActive: { backgroundColor: colors.text },
    pillText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
    pillTextActive: { color: colors.background }, // Inverted text color for active pill
    dateRow: { flexDirection: 'row', justifyContent: 'flex-end' },
    dateText: { fontSize: 13, color: colors.textMuted },
    summaryStrip: { flexDirection: 'row', backgroundColor: colors.surface, padding: 12, marginBottom: 1, justifyContent: 'space-around', borderBottomWidth: 1, borderColor: colors.border },
    summaryItem: { alignItems: 'center' },
    summaryLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
    summaryValue: { fontSize: 15, fontWeight: '700', color: colors.text },
    summaryDivider: { width: 1, backgroundColor: colors.border },
    list: { padding: 16, gap: 12, paddingBottom: 40 },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    invoiceNum: { fontSize: 15, fontWeight: '600', color: colors.text },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: '700' },
    customerName: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    date: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    cardDivider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 12 },
    amountLabel: { fontSize: 14, color: colors.textSecondary },
    amountValue: { fontSize: 16, fontWeight: '700', color: colors.text },
    dueLabel: { fontSize: 12, color: colors.success },
    dueValue: { fontSize: 12, fontWeight: '600' },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: colors.textMuted }
});
