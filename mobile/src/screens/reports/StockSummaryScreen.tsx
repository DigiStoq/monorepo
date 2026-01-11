import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Search, Package } from "lucide-react-native";
import { useStockSummaryReport, StockSummaryItem } from "../../hooks/useReports";
import { CustomHeader } from "../../components/CustomHeader";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../../lib/theme";
import { useTheme } from "../../contexts/ThemeContext";

export function StockSummaryScreen() {
    const navigation = useNavigation();
    const [search, setSearch] = useState("");
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const { summary, isLoading } = useStockSummaryReport();

    const filteredItems = summary?.items.filter(item =>
        (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.sku || "").toLowerCase().includes(search.toLowerCase())
    ) || [];

    const formatCurrency = (amount: number) => "$" + (amount || 0).toFixed(2);

    const getStatusColor = (status: StockSummaryItem['status']) => {
        switch (status) {
            case 'out-of-stock': return colors.danger;
            case 'low-stock': return colors.warning;
            case 'in-stock': return colors.success;
            default: return colors.textMuted;
        }
    };

    const getStatusLabel = (status: StockSummaryItem['status']) => {
        switch (status) {
            case 'out-of-stock': return 'Out of Stock';
            case 'low-stock': return 'Low Stock';
            case 'in-stock': return 'In Stock';
            default: return '';
        }
    };

    return (
        <View style={styles.container}>
            <CustomHeader title="Stock Summary" />

            <View style={styles.mainContent}>
                {/* Overview Cards */}
                <View style={styles.overviewContainer}>
                    {isLoading ? <Text style={styles.loadingText}>Loading...</Text> : (
                        <>
                            <View style={styles.overviewCard}>
                                <Text style={styles.overviewLabel}>Total Value</Text>
                                <Text style={styles.overviewValue}>{formatCurrency(summary?.totalValue || 0)}</Text>
                                <Text style={styles.overviewSub}>{summary?.totalItems || 0} Items</Text>
                            </View>
                            <View style={styles.overviewCard}>
                                <Text style={styles.overviewLabel}>Low Stock</Text>
                                <Text style={[styles.overviewValue, { color: colors.warning }]}>{summary?.lowStockCount || 0}</Text>
                                <Text style={styles.overviewSub}>Items needing reorder</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Search */}
                <View style={styles.searchSection}>
                    <View style={styles.searchBox}>
                        <Search size={18} color={colors.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search item name or SKU..."
                            placeholderTextColor={colors.textMuted}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                {/* List */}
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.titleInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.sku}>SKU: {item.sku}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                        {getStatusLabel(item.status)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.detailsRow}>
                                <View>
                                    <Text style={styles.detailLabel}>Stock Qty</Text>
                                    <Text style={styles.detailValue}>{item.stockQuantity}</Text>
                                </View>
                                <View>
                                    <Text style={styles.detailLabel}>Buy Price</Text>
                                    <Text style={styles.detailValue}>{formatCurrency(item.purchasePrice)}</Text>
                                </View>
                                <View>
                                    <Text style={styles.detailLabel}>Stock Value</Text>
                                    <Text style={styles.detailValue}>{formatCurrency(item.stockValue)}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Package size={48} color={colors.border} />
                            <Text style={styles.emptyText}>{isLoading ? "Loading..." : "No items found"}</Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    mainContent: { flex: 1 },
    overviewContainer: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md },
    overviewCard: { flex: 1, backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
    overviewLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 4 },
    overviewValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: 2 },
    overviewSub: { fontSize: 10, color: colors.textMuted },
    loadingText: { color: colors.textMuted },
    searchSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, height: 44 },
    searchInput: { flex: 1, marginLeft: spacing.sm, height: '100%', fontSize: fontSize.md, color: colors.text },
    list: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40, paddingTop: 0 },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
    titleInfo: { flex: 1, marginRight: spacing.sm },
    itemName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
    sku: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
    statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
    statusText: { fontSize: 10, fontWeight: fontWeight.bold },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surfaceHover, padding: spacing.sm, borderRadius: borderRadius.md },
    detailLabel: { fontSize: 10, color: colors.textSecondary, marginBottom: 2 },
    detailValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
    emptyState: { padding: 40, alignItems: 'center', gap: spacing.md },
    emptyText: { color: colors.textMuted }
});
