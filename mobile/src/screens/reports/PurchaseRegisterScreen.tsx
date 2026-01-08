import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar, FileText } from "lucide-react-native";
import { usePurchaseRegisterReport, DateRange } from "../../hooks/useReports";

export function PurchaseRegisterScreen() {
    const navigation = useNavigation();
    
    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = usePurchaseRegisterReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.invoiceNum}>{item.invoice_number}</Text>
                    <Text style={styles.date}>{item.date}</Text>
                </View>
                <View style={[styles.badge, styles[item.status]]}>
                    <Text style={styles.badgeText}>{item.status}</Text>
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Purchase Register</Text>
                 <TouchableOpacity style={styles.iconBtn}>
                    <Calendar color="#64748b" size={24} />
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderColor: "#e2e8f0", marginTop: Platform.OS === 'android' ? 24 : 0 },
    iconBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: "#0f172a" },
    content: { flex: 1 },
    dateDisplay: { alignItems: 'center', padding: 12, backgroundColor: '#f1f5f9' },
    dateText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    list: { padding: 16, gap: 12 },
    loadingText: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    invoiceNum: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    date: { fontSize: 12, color: '#64748b' },
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    customer: { fontSize: 14, color: '#334155' },
    total: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 8 },
    footerText: { fontSize: 12, color: '#16a34a' },
    dueText: { fontSize: 12, color: '#dc2626' },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: '#f1f5f9' },
    badgeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
    paid: { backgroundColor: '#dcfce7' },
    partial: { backgroundColor: '#fef9c3' },
    sent: { backgroundColor: '#dbeafe' },
    draft: { backgroundColor: '#f1f5f9' },
    cancelled: { backgroundColor: '#fee2e2' },
});
