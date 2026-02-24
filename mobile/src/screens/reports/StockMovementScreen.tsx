import React, { useState } from "react";
import { View, Text, FlatList } from "react-native";
import { ReportScreenLayout } from "../../components/reports/ReportScreenLayout";
import type { DateRange } from "../../hooks/useReports";
import { useStockMovementReport } from "../../hooks/useReports";

export function StockMovementScreen() {

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useStockMovementReport(dateRange);

    const renderItem = ({ item }: { item: any }) => {
        const netChange = item.in_qty - item.out_qty;
        return (
            <View className="bg-surface p-4 rounded-xl border border-border shadow-sm">
                <View className="flex-row justify-between mb-4 border-b border-border pb-2">
                    <Text className="text-base font-semibold text-text">{item.item_name}</Text>
                </View>
                <View className="flex-row justify-between">
                    <View className="flex-1 items-center bg-success/10 rounded-lg p-2 mr-2">
                        <Text className="text-xs text-text-muted mb-1">In</Text>
                        <Text className="text-base font-bold text-text">+{item.in_qty}</Text>
                    </View>
                    <View className="flex-1 items-center bg-danger/10 rounded-lg p-2 mr-2">
                        <Text className="text-xs text-text-muted mb-1">Out</Text>
                        <Text className="text-base font-bold text-text">-{item.out_qty}</Text>
                    </View>
                    <View className="flex-1 items-center bg-surface-hover rounded-lg p-2">
                        <Text className="text-xs text-text-muted mb-1">Net</Text>
                        <Text className={`text-base font-bold ${netChange >= 0 ? 'text-success' : 'text-danger'}`}>
                            {netChange > 0 ? '+' : ''}{netChange}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <ReportScreenLayout title="Stock Movement" dateRange={dateRange} onDateRangeChange={setDateRange}>
            <View className="flex-1">
                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.item_id}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        ListEmptyComponent={<Text className="text-center mt-10 text-text-muted">No movement found in this period.</Text>}
                    />
                )}
            </View>
        </ReportScreenLayout>
    );
}
