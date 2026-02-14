import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeftIcon, CalendarIcon } from "../../components/ui/UntitledIcons";
import type { DateRange } from "../../hooks/useReports";
import { useStockMovementReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";

export function StockMovementScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();

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
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between p-4 bg-surface border-b border-border mt-6 android:mt-6">
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ArrowLeftIcon color={colors.text} size={24} />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-text">Stock Movement</Text>
                <TouchableOpacity className="p-2">
                    <CalendarIcon color={colors.textSecondary} size={24} />
                </TouchableOpacity>
            </View>

            <View className="flex-1">
                <View className="items-center py-3 bg-surface-hover">
                    <Text className="text-sm text-text-secondary font-medium">{dateRange.from} - {dateRange.to}</Text>
                </View>

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
        </View>
    );
}
