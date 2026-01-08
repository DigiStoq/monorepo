import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar, Search, Filter } from "lucide-react-native";
import { useSalesRegisterReport, DateRange } from "../../hooks/useReports";

export function SalesRegisterScreen() {
    const navigation = useNavigation();
    
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
        switch(status) {
            case 'paid': return '#16a34a';
            case 'partial': return '#ea580c';
            case 'unpaid': return '#dc2626';
            default: return '#64748b';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sales Register</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Filters */}
            <View style={styles.filterSection}>
                <View style={styles.searchBox}>
                    <Search size={18} color="#94a3b8" />
                    <TextInput 
                        style={styles.searchInput} 
                        placeholder="Search invoice or customer..." 
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
                                statusFilter === s && { backgroundColor: getStatusColor(s) === '#64748b' ? '#0f172a' : getStatusColor(s) }
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
                    <Text style={[styles.summaryValue, { color: '#16a34a' }]}>{formatCurrency(totals.paid)}</Text>
                </View>
                 <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Due</Text>
                    <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{formatCurrency(totals.due)}</Text>
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
                                <Text style={[styles.dueValue, { color: item.due > 0 ? '#dc2626' : '#16a34a' }]}>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderColor: "#e2e8f0", marginTop: Platform.OS === 'android' ? 24 : 0 },
    iconBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: "#0f172a" },
    filterSection: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#f1f5f9' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 10, height: 40, marginBottom: 12 },
    searchInput: { flex: 1, marginLeft: 8, height: '100%', fontSize: 15 },
    pillsScroll: { flexDirection: 'row', marginBottom: 12 },
    pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8 },
    pillActive: { backgroundColor: '#0f172a' },
    pillText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    pillTextActive: { color: 'white' },
    dateRow: { flexDirection: 'row', justifyContent: 'flex-end' },
    dateText: { fontSize: 13, color: '#64748b' },
    summaryStrip: { flexDirection: 'row', backgroundColor: 'white', padding: 12, marginBottom: 1, justifyContent: 'space-around', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    summaryItem: { alignItems: 'center' },
    summaryLabel: { fontSize: 11, color: '#64748b', marginBottom: 2 },
    summaryValue: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    summaryDivider: { width: 1, backgroundColor: '#e2e8f0' },
    list: { padding: 16, gap: 12, paddingBottom: 40 },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    invoiceNum: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: '700' },
    customerName: { fontSize: 14, color: '#334155', marginTop: 4 },
    date: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
    cardDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
    amountLabel: { fontSize: 14, color: '#64748b' },
    amountValue: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    dueLabel: { fontSize: 12, color: '#16a34a' },
    dueValue: { fontSize: 12, fontWeight: '600' },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#94a3b8' }
});
