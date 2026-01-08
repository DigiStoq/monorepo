import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Search, Filter, Share2, Calendar } from "lucide-react-native";
import { useCustomerStatementReport, DateRange } from "../../hooks/useReports";
import { useQuery } from "@powersync/react-native";

interface CustomerSelection {
    id: string;
    name: string;
}

export function CustomerStatementScreen() {
    const navigation = useNavigation();
    
    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerSelection | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);

    // Fetch statement if customer selected
    const { statement, isLoading } = useCustomerStatementReport(
        selectedCustomer?.id || "",
        dateRange
    );

    // Fetch customers list for modal
    const { data: allCustomers } = useQuery<{id: string; name: string}>(
        `SELECT id, name FROM customers ORDER BY name`
    );

    const formatCurrency = (amount: number) => "$" + (amount || 0).toFixed(2);
    const formatDate = (date: string) => new Date(date).toLocaleDateString();

    const renderCustomerModal = () => (
        <Modal visible={showCustomerModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Customer</Text>
                        <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={allCustomers || []}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={styles.customerItem}
                                onPress={() => {
                                    setSelectedCustomer(item);
                                    setShowCustomerModal(false);
                                }}
                            >
                                <Text style={styles.customerItemName}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Customer Statement</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Share2 color="#64748b" size={20} />
                </TouchableOpacity>
            </View>

            {/* Inputs */}
            <View style={styles.filterSection}>
                <TouchableOpacity 
                    style={styles.customerSelector}
                    onPress={() => setShowCustomerModal(true)}
                >
                    <Search size={18} color="#64748b" />
                    <Text style={[styles.selectorText, !selectedCustomer && {color: '#94a3b8'}]}>
                        {selectedCustomer ? selectedCustomer.name : "Select Customer..."}
                    </Text>
                </TouchableOpacity>
                <View style={styles.dateRow}>
                     <Calendar size={16} color="#64748b" />
                     <Text style={styles.dateText}>{dateRange.from} - {dateRange.to}</Text>
                </View>
            </View>

            {/* Statement Content */}
            {!selectedCustomer ? (
                <View style={styles.emptyState}>
                    <View style={styles.placeholderIcon}>
                        <Search size={40} color="#cbd5e1" />
                    </View>
                    <Text style={styles.emptyText}>Select a customer to view their statement</Text>
                </View>
            ) : isLoading ? (
                <View style={styles.emptyState}>
                     <Text style={styles.loadingText}>Loading statement...</Text>
                </View>
            ) : !statement ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No data found</Text>
                </View>
            ) : (
                <View style={{flex: 1}}>
                    {/* Summary Header */}
                    <View style={styles.summaryCard}>
                         <View style={styles.summaryRow}>
                            <View style={styles.summaryCol}>
                                <Text style={styles.summaryLabel}>Opening</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(statement.openingBalance)}</Text>
                            </View>
                            <View style={styles.summaryCol}>
                                <Text style={styles.summaryLabel}>Debited</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(statement.totalDebit)}</Text>
                            </View>
                            <View style={styles.summaryCol}>
                                <Text style={styles.summaryLabel}>Credited</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(statement.totalCredit)}</Text>
                            </View>
                         </View>
                         <View style={styles.divider} />
                         <View style={[styles.summaryRow, { justifyContent: 'space-between', marginTop: 12}]}>
                             <Text style={styles.closingLabel}>Closing Balance</Text>
                             <Text style={[styles.closingValue, { color: statement.closingBalance > 0 ? '#dc2626' : '#16a34a' }]}>
                                {formatCurrency(Math.abs(statement.closingBalance))} {statement.closingBalance > 0 ? 'Dr' : 'Cr'}
                             </Text>
                         </View>
                    </View>
                    
                    {/* Ledger Table Header */}
                    <View style={styles.tableHeader}>
                         <Text style={[styles.th, { width: 80 }]}>Date</Text>
                         <Text style={[styles.th, { flex: 1 }]}>Desc</Text>
                         <Text style={[styles.th, { width: 70, textAlign: 'right' }]}>Debit</Text>
                         <Text style={[styles.th, { width: 70, textAlign: 'right' }]}>Credit</Text>
                    </View>

                    <FlatList
                        data={statement.entries}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => (
                            <View style={[styles.row, item.type === 'opening' && { backgroundColor: '#f8fafc' }]}>
                                <View style={{ width: 80 }}>
                                    <Text style={styles.date}>{formatDate(item.date)}</Text>
                                    <Text style={styles.refNum}>{item.referenceNumber}</Text>
                                </View>
                                <View style={{ flex: 1, paddingRight: 4 }}>
                                    <Text style={styles.desc}>{item.description}</Text>
                                    <Text style={styles.balanceSub}>Bal: {formatCurrency(item.balance)}</Text>
                                </View>
                                <Text style={[styles.amount, { width: 70, color: item.debit ? '#0f172a' : '#cbd5e1' }]}>
                                    {item.debit ? formatCurrency(item.debit) : '-'}
                                </Text>
                                <Text style={[styles.amount, { width: 70, color: item.credit ? '#16a34a' : '#cbd5e1' }]}>
                                    {item.credit ? formatCurrency(item.credit) : '-'}
                                </Text>
                            </View>
                        )}
                    />
                </View>
            )}

            {renderCustomerModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderColor: "#e2e8f0", marginTop: Platform.OS === 'android' ? 24 : 0 },
    iconBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: "#0f172a" },
    
    filterSection: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#f1f5f9' },
    customerSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, marginBottom: 12 },
    selectorText: { marginLeft: 8, fontSize: 15, color: '#0f172a' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
    dateText: { fontSize: 13, color: '#64748b' },

    summaryCard: { margin: 16, backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 0 },
    summaryRow: { flexDirection: 'row' },
    summaryCol: { flex: 1 },
    summaryLabel: { fontSize: 12, color: '#64748b' },
    summaryValue: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
    closingLabel: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    closingValue: { fontSize: 18, fontWeight: '700' },

    tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f1f5f9', marginTop: 16, borderTopWidth: 1, borderColor: '#e2e8f0', borderBottomWidth: 1 },
    th: { fontSize: 12, fontWeight: '600', color: '#64748b' },
    
    list: { paddingBottom: 40 },
    row: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderColor: '#f1f5f9', backgroundColor: 'white' },
    date: { fontSize: 13, color: '#334155' },
    refNum: { fontSize: 11, color: '#64748b' },
    desc: { fontSize: 13, color: '#334155', fontWeight: '500' },
    balanceSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    amount: { fontSize: 13, textAlign: 'right' },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    placeholderIcon: { width: 80, height: 80, backgroundColor: '#f1f5f9', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyText: { color: '#64748b', fontSize: 15 },
    loadingText: { color: '#94a3b8' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: '70%', padding: 16 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    closeText: { color: '#3b82f6', fontSize: 16 },
    customerItem: { paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f1f5f9' },
    customerItemName: { fontSize: 16, color: '#0f172a' }
});
