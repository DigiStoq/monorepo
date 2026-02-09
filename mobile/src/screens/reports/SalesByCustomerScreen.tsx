import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Search } from "lucide-react-native";
import { useSalesByCustomerReport, DateRange } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

export function SalesByCustomerScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });
    const [search, setSearch] = useState("");

    const { data, isLoading } = useSalesByCustomerReport(dateRange);

    const filteredData = data.filter(item =>
        (item.customerName || "").toLowerCase().includes(search.toLowerCase())
    );

    const maxAmount = filteredData.length > 0 ? Math.max(...filteredData.map(d => d.totalAmount)) : 1;

    const formatCurrency = (amount: number) => "$" + (amount || 0).toFixed(2);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sales by Customer</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Filter Section */}
            <View style={styles.filterSection}>
                <View style={styles.dateRow}>
                    <Text style={styles.dateText}>{dateRange.from} - {dateRange.to}</Text>
                </View>
                <View style={styles.searchBox}>
                    <Search size={18} color={colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search customers..."
                        placeholderTextColor={colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.customerId || item.customerName}
                contentContainerStyle={styles.list}
                renderItem={({ item, index }) => (
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.rank}>#{index + 1}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.customerName}>{item.customerName}</Text>
                                <Text style={styles.countText}>{item.invoiceCount} invoices</Text>
                            </View>
                            <Text style={styles.amount}>{formatCurrency(item.totalAmount)}</Text>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${(item.totalAmount / maxAmount) * 100}%` }]} />
                        </View>

                        <View style={styles.statsRow}>
                            <Text style={[styles.stat, { color: colors.success }]}>Paid: {formatCurrency(item.paidAmount)}</Text>
                            <Text style={[styles.stat, { color: colors.danger }]}>Due: {formatCurrency(item.dueAmount)}</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>{isLoading ? "Loading..." : "No available data"}</Text>
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
    dateRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
    dateText: { fontSize: 13, color: colors.textMuted },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceHover, borderRadius: 8, paddingHorizontal: 10, height: 40 },
    searchInput: { flex: 1, marginLeft: 8, height: '100%', fontSize: 15, color: colors.text },
    list: { padding: 16, gap: 12, paddingBottom: 40 },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rank: { fontSize: 14, color: colors.textMuted, width: 30, fontWeight: '500' },
    customerName: { fontSize: 15, fontWeight: '600', color: colors.text },
    countText: { fontSize: 12, color: colors.textMuted },
    amount: { fontSize: 16, fontWeight: '700', color: colors.text },
    progressBg: { height: 6, backgroundColor: colors.surfaceHover, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
    progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    stat: { fontSize: 12, fontWeight: '500' },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: colors.textMuted }
});
