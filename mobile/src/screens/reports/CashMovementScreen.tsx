import React, { useState } from "react";
import { View, Text, FlatList } from "react-native";
import { ReportScreenLayout } from "../../components/reports/ReportScreenLayout";
import type { DateRange } from "../../hooks/useReports";
import { useCashMovementReport } from "../../hooks/useReports";

export function CashMovementScreen() {

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useCashMovementReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-surface p-4 rounded-xl border border-border shadow-sm">
            <View className="flex-row justify-between mb-3 border-b border-border pb-2">
                <Text className="text-base font-semibold text-text capitalize">{item.mode || 'Unknown Mode'}</Text>
                <Text className={`text-sm font-bold ${item.net >= 0 ? 'text-success' : 'text-danger'}`}>
                    Net: {formatCurrency(item.net)}
                </Text>
            </View>
            <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-text-secondary">In:</Text>
                <Text className="text-sm font-semibold text-success">{formatCurrency(item.inAmount)}</Text>
            </View>
            <View className="flex-row justify-between">
                <Text className="text-sm text-text-secondary">Out:</Text>
                <Text className="text-sm font-semibold text-danger">{formatCurrency(item.outAmount)}</Text>
            </View>
        </View>
    );

    return (
        <ReportScreenLayout title="Cash Movement" dateRange={dateRange} onDateRangeChange={setDateRange}>
            <View className="flex-1">
                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.mode}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        ListEmptyComponent={<Text className="text-center mt-10 text-text-muted">No cash movement found.</Text>}
                    />
                )}
            </View>
        </ReportScreenLayout>
    );
}
