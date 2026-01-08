import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Calendar, FileText } from "lucide-react-native";
import { useTaxSummaryReport, DateRange } from "../../hooks/useReports";

export function TaxSummaryScreen() {
    const navigation = useNavigation();
    
    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useTaxSummaryReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    return (
        <View style={styles.container}>
             <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tax Summary</Text>
                 <TouchableOpacity style={styles.iconBtn}>
                    <Calendar color="#64748b" size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                 <View style={styles.dateDisplay}>
                    <Text style={styles.dateText}>{dateRange.from} - {dateRange.to}</Text>
                </View>

                {isLoading ? (
                     <Text style={styles.loadingText}>Loading...</Text>
                ) : !data ? (
                     <Text style={styles.loadingText}>No tax data.</Text>
                ) : (
                    <>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Tax Collected (Output)</Text>
                            <Text style={styles.subtitle}>From Sales</Text>
                            <Text style={[styles.amount, styles.pos]}>+{formatCurrency(data.taxCollected)}</Text>
                        </View>

                         <View style={styles.card}>
                            <Text style={styles.cardTitle}>Tax Paid (Input)</Text>
                            <Text style={styles.subtitle}>From Purchases</Text>
                            <Text style={[styles.amount, styles.neg]}>-{formatCurrency(data.taxPaid)}</Text>
                        </View>

                        <View style={[styles.card, styles.netCard]}>
                             <Text style={styles.cardTitle}>Net Tax Payable</Text>
                             <Text style={[styles.amount, data.netTax >= 0 ? styles.pos : styles.neg]}>
                                 {formatCurrency(data.netTax)}
                             </Text>
                             <Text style={styles.note}>
                                 {data.netTax > 0 ? "You owe this amount to tax authority." : "You have a tax credit."}
                             </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderColor: "#e2e8f0", marginTop: Platform.OS === 'android' ? 24 : 0 },
    iconBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: "#0f172a" },
    content: { padding: 16, gap: 16 },
    dateDisplay: { alignItems: 'center', marginBottom: 8 },
    dateText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    loadingText: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
    card: { backgroundColor: 'white', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
    netCard: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
    cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
    subtitle: { fontSize: 12, color: '#64748b', marginBottom: 12 },
    amount: { fontSize: 32, fontWeight: '700' },
    pos: { color: '#16a34a' },
    neg: { color: '#dc2626' },
    note: { fontSize: 12, color: '#3b82f6', marginTop: 8 },
});
