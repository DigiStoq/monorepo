import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@powersync/react-native";
import { Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react-native";
import { ChequeRecord } from "../lib/powersync";

export function ChequesScreen() {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'received' | 'issued'>('all');
    
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
            case 'cleared': return '#16a34a'; // green
            case 'bounced': return '#dc2626'; // red
            case 'cancelled': return '#64748b'; // gray
            default: return '#eab308'; // yellow/pending
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
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

                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => navigation.navigate("ChequeForm" as any)}
                >
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={cheques || []}
                keyExtractor={(item) => item.id || item.created_at}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                }
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.card}
                        onPress={() => navigation.navigate("ChequeForm" as any, { id: item.id })}
                    >
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: item.type === 'received' ? '#dcfce7' : '#fee2e2' }]}>
                                {item.type === 'received' 
                                    ? <ArrowDownLeft color="#16a34a" size={20} />
                                    : <ArrowUpRight color="#dc2626" size={20} />
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#e2e8f0'
    },
    filterContainer: { flexDirection: 'row', gap: 8 },
    filterPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    filterPillActive: { backgroundColor: '#6366f1' },
    filterText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
    filterTextActive: { color: 'white' },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    headerInfo: { flex: 1 },
    customerName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
    bankName: { fontSize: 12, color: '#64748b', marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderColor: '#f1f5f9' },
    date: { fontSize: 13, color: '#64748b' },
    amount: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { color: '#94a3b8' }
});
