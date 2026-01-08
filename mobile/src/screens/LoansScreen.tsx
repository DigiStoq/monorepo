import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@powersync/react-native";
import { Plus, HandCoins, ArrowRight } from "lucide-react-native";
import { LoanRecord } from "../lib/powersync";

export function LoansScreen() {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'given' | 'taken'>('all');
    
    // Loans Query
    // 'taken' = I borrowed money (Liability)
    // 'given' = I lent money (Asset)
    const query = filterType === 'all' 
        ? `SELECT * FROM loans ORDER BY start_date DESC, created_at DESC`
        : `SELECT * FROM loans WHERE type = '${filterType}' ORDER BY start_date DESC, created_at DESC`;

    const { data: loans } = useQuery<LoanRecord>(query);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'closed': return '#16a34a'; // green
            case 'defaulted': return '#dc2626'; // red
            default: return '#3b82f6'; // blue (active)
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
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

                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => navigation.navigate("LoanForm" as any)}
                >
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={loans || []}
                keyExtractor={(item) => item.id || item.created_at}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                }
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.card}
                        onPress={() => navigation.navigate("LoanForm" as any, { id: item.id })}
                    >
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: item.type === 'given' ? '#dcfce7' : '#fee2e2' }]}>
                                <HandCoins color={item.type === 'given' ? '#16a34a' : '#dc2626'} size={20} />
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
                                <Text style={[styles.value, { color: (item.outstanding_amount || 0) > 0 ? '#ea580c' : '#16a34a' }]}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { 
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    filterContainer: { flexDirection: 'row', gap: 8, flex: 1, marginRight: 8, overflow: 'hidden' },
    filterPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    filterPillActive: { backgroundColor: '#6366f1' },
    filterText: { color: '#64748b', fontSize: 12, fontWeight: '500' },
    filterTextActive: { color: 'white' },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#6366f1',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    listContent: { padding: 16, paddingBottom: 30, gap: 12 },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    headerInfo: { flex: 1 },
    partyName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    loanType: { fontSize: 12, color: '#64748b', marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 },
    label: { fontSize: 12, color: '#64748b', marginBottom: 2 },
    value: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    progressContainer: { 
        backgroundColor: '#f8fafc', 
        padding: 8, 
        borderRadius: 8, 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#f1f5f9' 
    },
    progressText: { fontSize: 12, color: '#475569', fontWeight: '500' },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { color: '#94a3b8' }
});
