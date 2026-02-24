import React, { useState } from "react";
import { View, Text, FlatList } from "react-native";
import { ReportScreenLayout } from "../../components/reports/ReportScreenLayout";
import type { DateRange } from "../../hooks/useReports";
import { useItemProfitabilityReport } from "../../hooks/useReports";

export function ItemProfitabilityScreen() {

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useItemProfitabilityReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => {
        const margin = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : "0";
        return (
            <View className="bg-surface p-4 rounded-xl border border-border shadow-sm">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-base font-semibold text-text">{item.item_name}</Text>
                    <Text className={`text-base font-bold ${item.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(item.profit)}
                    </Text>
                </View>
                <View className="flex-row gap-3 mb-2">
                    <Text className="text-xs text-text-secondary">Sold: {item.quantity_sold}</Text>
                    <Text className="text-xs text-text-secondary">Rev: {formatCurrency(item.revenue)}</Text>
                    <Text className="text-xs text-text-secondary">Cost: {formatCurrency(item.cost)}</Text>
                </View>
                <View className="flex-row gap-1 items-center justify-end border-t border-border pt-2">
                    <Text className="text-xs text-text-secondary">Margin:</Text>
                    <Text className={`text-xs font-semibold ${item.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {margin}%
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <ReportScreenLayout title="Item Profitability" dateRange={dateRange} onDateRangeChange={setDateRange}>
            <View className="flex-1">
                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.item_id}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        ListEmptyComponent={<Text className="text-center mt-10 text-text-muted">No sales data available.</Text>}
                    />
                )}
            </View>
        </ReportScreenLayout>
    );
}
