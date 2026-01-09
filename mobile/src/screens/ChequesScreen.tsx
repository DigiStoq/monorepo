import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@powersync/react-native";
import { Plus, ArrowUpRight, ArrowDownLeft, Trash2 } from "lucide-react-native";
import { ChequeRecord } from "../lib/powersync";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../lib/theme";
import { CustomHeader } from "../components/CustomHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function ChequesScreen() {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'received' | 'issued'>('all');
    const insets = useSafeAreaInsets();
    
    // Cheques Query
    const query = filterType === 'all' 
        ? `SELECT * FROM cheques ORDER BY date DESC, created_at DESC`
        : `SELECT * FROM cheques WHERE type = '${filterType}' ORDER BY date DESC, created_at DESC`;

    const { data: cheques } = useQuery<ChequeRecord>(query);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    // Helper to get status color
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'cleared': return colors.success;
            case 'bounced': return colors.danger;
            case 'cancelled': return colors.textMuted;
            default: return colors.warning;
        }
    };

    return (
        <View style={styles.container}>
            <CustomHeader />
            
            <View style={styles.subHeader}>
                <View style={styles.filterContainer}>
                    {['all', 'received', 'issued'].map((type) => (
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
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* List */}
            <FlatList
                data={cheques || []}
                keyExtractor={(item) => item.id || item.created_at}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
                }
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.card}
                        onPress={() => navigation.navigate("ChequeForm" as any, { id: item.id })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: item.type === 'received' ? colors.successMuted : colors.dangerMuted }]}>
                                {item.type === 'received' 
                                    ? <ArrowDownLeft color={colors.success} size={20} />
                                    : <ArrowUpRight color={colors.danger} size={20} />
                                }
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.customerName}>{item.customer_name || 'Unknown Party'}</Text>
                                <Text style={styles.bankName}>{item.bank_name} • {item.cheque_number}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: getStatusColor(item.status || 'pending') + '20' }]}>
                                <Text style={[styles.badgeText, { color: getStatusColor(item.status || 'pending') }]}>
                                    {item.status || 'Pending'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.cardFooter}>
                            <Text style={styles.date}>Due: {item.due_date || item.date}</Text>
                            <Text style={styles.amount}>${(item.amount || 0).toFixed(2)}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No cheques found</Text>
                    </View>
                }
            />
            
           {/* FAB */}
           <TouchableOpacity
             style={[styles.fab, { bottom: insets.bottom + spacing.xl }]}
             onPress={() => (navigation as any).navigate("ChequeForm")}
           >
             <Text style={styles.fabText}>+ Add</Text>
           </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    subHeader: { 
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
    },
    filterContainer: { flexDirection: 'row', gap: spacing.sm },
    filterPill: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surfaceHover,
    },
    filterPillActive: { backgroundColor: colors.accent },
    filterText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
    filterTextActive: { color: colors.textOnAccent },
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100, gap: spacing.sm },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        ...shadows.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
    iconBox: { width: 40, height: 40, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
    headerInfo: { flex: 1 },
    customerName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
    bankName: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
    badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
    badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'capitalize' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md, borderTopWidth: 1, borderColor: colors.border },
    date: { fontSize: fontSize.sm, color: colors.textMuted },
    amount: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { color: colors.textMuted, fontSize: fontSize.md },
    fab: {
        position: 'absolute',
        right: spacing.xl,
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        ...shadows.md,
    },
    fabText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textOnAccent,
    },
});
