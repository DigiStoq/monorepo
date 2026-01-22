import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@powersync/react-native";
import { Plus, HandCoins, ArrowRight } from "lucide-react-native";
import { LoanRecord } from "../lib/powersync";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../lib/theme";
import { CustomHeader } from "../components/CustomHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";

export function LoansScreen() {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'given' | 'taken'>('all');
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Loans Query
    const query = filterType === 'all'
        ? `SELECT * FROM loans ORDER BY start_date DESC, created_at DESC`
        : `SELECT * FROM loans WHERE type = '${filterType}' ORDER BY start_date DESC, created_at DESC`;

    const { data: loans } = useQuery<LoanRecord>(query);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'closed': return colors.success;
            case 'defaulted': return colors.danger;
            default: return colors.info; // blue (active)
        }
    };

    return (
        <View style={styles.container}>
            <CustomHeader title="Loans" showBack />

            <View style={styles.subHeader}>
                <View style={styles.filterContainer}>
                    {['all', 'given', 'taken'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.filterPill,
                                filterType === type && styles.filterPillActive
                            ]}
                            onPress={() => setFilterType(type as any)}
                        >
                            <Text style={[
                                styles.filterText,
                                filterType === type && styles.filterTextActive
                            ]}>
                                {type === 'all' ? 'All Loans' : type === 'given' ? 'Given (Assets)' : 'Taken (Liabilities)'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* List */}
            <FlatList
                data={loans || []}
                keyExtractor={(item) => item.id || item.created_at}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
                }
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate("LoanForm" as any, { id: item.id })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: item.type === 'given' ? colors.success + '20' : colors.danger + '20' }]}>
                                <HandCoins color={item.type === 'given' ? colors.success : colors.danger} size={20} />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.partyName}>{item.type === 'given' ? item.customer_name : item.lender_name}</Text>
                                <Text style={styles.loanType}>{item.type === 'given' ? 'Money Lent' : 'Money Borrowed'}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: getStatusColor(item.status || 'active') + '20' }]}>
                                <Text style={[styles.badgeText, { color: getStatusColor(item.status || 'active') }]}>
                                    {item.status || 'Active'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailsRow}>
                            <View>
                                <Text style={styles.label}>Principal</Text>
                                <Text style={styles.value}>${(item.principal_amount || 0).toFixed(2)}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.label}>Outstanding</Text>
                                <Text style={[styles.value, { color: (item.outstanding_amount || 0) > 0 ? colors.warning : colors.success }]}>
                                    ${(item.outstanding_amount || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.progressContainer}>
                            <Text style={styles.progressText}>
                                {item.interest_rate}% Interest • {item.paid_emis || 0}/{item.total_emis || 0} EMIs Paid
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No loans found</Text>
                    </View>
                }
            />

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { bottom: insets.bottom + spacing.xl }]}
                onPress={() => (navigation as any).navigate("LoanForm")}
            >
                <Text style={styles.fabText}>+ Add</Text>
            </TouchableOpacity>
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    subHeader: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
    },
    filterContainer: { flexDirection: 'row', gap: spacing.sm, flex: 1 },
    filterPill: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surfaceHover,
    },
    filterPillActive: { backgroundColor: colors.primary },
    filterText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
    filterTextActive: { color: "#ffffff" },
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100, gap: spacing.sm },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        ...shadows.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
    iconBox: { width: 44, height: 44, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
    headerInfo: { flex: 1 },
    partyName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
    loanType: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
    badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
    badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'capitalize' },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, paddingHorizontal: 4 },
    label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 2 },
    value: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
    progressContainer: {
        backgroundColor: colors.background,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border
    },
    progressText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { color: colors.textMuted, fontSize: fontSize.md },
    fab: {
        position: 'absolute',
        right: spacing.xl,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        ...shadows.md,
    },
    fabText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: "#ffffff",
    },
});
