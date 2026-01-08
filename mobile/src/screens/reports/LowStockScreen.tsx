import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, AlertTriangle } from "lucide-react-native";
import { useLowStockReport } from "../../hooks/useReports";

export function LowStockScreen() {
    const navigation = useNavigation();
    const { data, isLoading } = useLowStockReport();

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Low Stock</Text>
                </View>
            </View>
            <View style={styles.cardFooter}>
                 <Text style={styles.currentStock}>Current: <Text style={styles.boldRed}>{item.stock_quantity}</Text></Text>
                 <Text style={styles.alertLevel}>Reorder Level: {item.low_stock_alert}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Low Stock Alert</Text>
                 <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {isLoading ? (
                     <Text style={styles.loadingText}>Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>All items are well stocked.</Text>
                            </View>
                        }
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
    list: { padding: 16, gap: 12 },
    loadingText: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { textAlign: 'center', color: '#64748b', fontSize: 16 },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    badge: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 10, color: '#dc2626', fontWeight: '700' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    currentStock: { fontSize: 14, color: '#334155' },
    boldRed: { fontWeight: '700', color: '#dc2626' },
    alertLevel: { fontSize: 12, color: '#64748b' },
});
