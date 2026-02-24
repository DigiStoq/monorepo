import React, { useState } from "react";
import { View, Text, FlatList } from "react-native";
import { ReportScreenLayout } from "../../components/reports/ReportScreenLayout";
import type { DateRange } from "../../hooks/useReports";
import { usePurchaseByItemReport } from "../../hooks/useReports";

export function PurchaseByItemScreen() {

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = usePurchaseByItemReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-surface p-4 rounded-xl border border-border shadow-sm">
            <View className="flex-row justify-between items-center mb-1">
                <Text className="text-base font-semibold text-text">{item.item_name}</Text>
                <Text className="text-base font-semibold text-text">{formatCurrency(item.amount)}</Text>
            </View>
            <Text className="text-xs text-text-muted">{item.quantity} purchased</Text>
        </View>
    );

    return (
        <ReportScreenLayout title="Purchase By Item" dateRange={dateRange} onDateRangeChange={setDateRange}>
            <View className="flex-1">
                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.item_id}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        ListEmptyComponent={<Text className="text-center mt-10 text-text-muted">No purchases found.</Text>}
                    />
                )}
            </View>
        </ReportScreenLayout>
    );
}
