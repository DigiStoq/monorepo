import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Search, Box, AlertTriangle, Package } from "lucide-react-native";
import { useStockSummaryReport, StockSummaryItem } from "../../hooks/useReports";

export function StockSummaryScreen() {
    const navigation = useNavigation();
    const [search, setSearch] = useState("");

    const { summary, isLoading } = useStockSummaryReport();

    const filteredItems = summary?.items.filter(item => 
        (item.name || "").toLowerCase().includes(search.toLowerCase()) || 
        (item.sku || "").toLowerCase().includes(search.toLowerCase())
    ) || [];

    const formatCurrency = (amount: number) => "$" + (amount || 0).toFixed(2);

    const getStatusColor = (status: StockSummaryItem['status']) => {
        switch(status) {
            case 'out-of-stock': return '#ef4444';
            case 'low-stock': return '#f97316';
            case 'in-stock': return '#22c55e';
            default: return '#64748b';
        }
    };

    const getStatusLabel = (status: StockSummaryItem['status']) => {
         switch(status) {
            case 'out-of-stock': return 'Out of Stock';
            case 'low-stock': return 'Low Stock';
            case 'in-stock': return 'In Stock';
            default: return '';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Stock Summary</Text>
                <View style={{ width: 40 }} />
            </View>

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
                            <Text style={[styles.overviewValue, { color: '#f97316' }]}>{summary?.lowStockCount || 0}</Text>
                             <Text style={styles.overviewSub}>Items needing reorder</Text>
                        </View>
                    </>
                 )}
            </View>

            {/* Search */}
            <View style={styles.searchSection}>
                <View style={styles.searchBox}>
                    <Search size={18} color="#94a3b8" />
                    <TextInput 
                        style={styles.searchInput} 
                        placeholder="Search item name or SKU..." 
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
                        <Package size={48} color="#e2e8f0" />
                        <Text style={styles.emptyText}>{isLoading ? "Loading..." : "No items found"}</Text>
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
    overviewContainer: { flexDirection: 'row', padding: 16, gap: 12 },
    overviewCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    overviewLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
    overviewValue: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
    overviewSub: { fontSize: 11, color: '#94a3b8' },
    loadingText: { color: '#94a3b8' },
    searchSection: { paddingHorizontal: 16, marginBottom: 16 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, height: 44, backgroundColor: 'white' },
    searchInput: { flex: 1, marginLeft: 8, height: '100%', fontSize: 15 },
    list: { padding: 16, gap: 12, paddingBottom: 40, paddingTop: 0 },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    titleInfo: { flex: 1, marginRight: 8 },
    itemName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
    sku: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: '700' },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 12, borderRadius: 8 },
    detailLabel: { fontSize: 11, color: '#64748b', marginBottom: 2 },
    detailValue: { fontSize: 14, fontWeight: '600', color: '#334155' },
    emptyState: { padding: 40, alignItems: 'center', gap: 12 },
    emptyText: { color: '#94a3b8' }
});
