import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import { useCustomerBalanceReport } from "../../hooks/useReports";

export function CustomerBalanceScreen() {
    const navigation = useNavigation();
    const { data, isLoading } = useCustomerBalanceReport();

    const formatCurrency = (amount: number) => {
        return "$" + Math.abs(amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => {
        const isPositive = item.current_balance >= 0; // Receivable
        return (
            <TouchableOpacity 
                style={styles.card}
                onPress={() => navigation.navigate('CustomerStatement', { customerId: item.id } as any)}
            >
                <View style={styles.cardRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={[styles.amount, { color: isPositive ? '#16a34a' : '#dc2626' }]}>
                        {formatCurrency(item.current_balance)} {isPositive ? '(Dr)' : '(Cr)'}
                    </Text>
                </View>
                <Text style={styles.phone}>{item.phone || 'No phone'}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Customer Balances</Text>
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
                        ListEmptyComponent={<Text style={styles.emptyText}>No balances found.</Text>}
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
    emptyText: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    amount: { fontSize: 16, fontWeight: '600' },
    phone: { fontSize: 12, color: '#64748b' },
});
