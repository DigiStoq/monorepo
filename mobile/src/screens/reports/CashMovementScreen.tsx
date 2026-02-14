import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeftIcon, CalendarIcon } from "../../components/ui/UntitledIcons";
import type { DateRange } from "../../hooks/useReports";
import { useCashMovementReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";

export function CashMovementScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();

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
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between p-4 bg-surface border-b border-border mt-6 android:mt-6">
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ArrowLeftIcon color={colors.text} size={24} />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-text">Cash Movement</Text>
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
                        keyExtractor={item => item.mode}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        ListEmptyComponent={<Text className="text-center mt-10 text-text-muted">No cash movement found.</Text>}
                    />
                )}
            </View>
        </View>
    );
}
