import React, { useState } from "react";
import { View, Text, FlatList } from "react-native";
import { CustomHeader } from "../../components/CustomHeader";
import { useDayBookReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";

export function DayBookScreen() {
    const { colors } = useTheme();

    // Default to today
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { data, isLoading } = useDayBookReport(date);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'Sale': return { bg: 'bg-primary', color: colors.primary };
            case 'Purchase': return { bg: 'bg-warning', color: colors.warning };
            case 'Payment In': return { bg: 'bg-success', color: colors.success };
            case 'Payment Out': return { bg: 'bg-danger', color: colors.danger };
            case 'Expense': return { bg: 'bg-info', color: colors.info };
            default: return { bg: 'bg-text-muted', color: colors.textMuted };
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const typeStyle = getTypeStyle(item.type);
        return (
            <View className="bg-surface p-4 rounded-xl border border-border flex-row justify-between items-center shadow-sm">
                <View className="gap-1">
                    <View className={`self-start px-1.5 py-0.5 rounded ${typeStyle.bg}`}>
                        <Text className="text-[10px] font-bold text-white">{item.type}</Text>
                    </View>
                    <Text className="text-sm text-text-secondary">{item.description || 'No Description'}</Text>
                </View>
                <View className="items-end">
                    {item.amount_in > 0 && <Text className="text-success font-semibold">+{formatCurrency(item.amount_in)}</Text>}
                    {item.amount_out > 0 && <Text className="text-danger font-semibold">-{formatCurrency(item.amount_out)}</Text>}
                </View>
            </View>
        );
    };

    const totalIn = data ? data.reduce((sum, item) => sum + item.amount_in, 0) : 0;
    const totalOut = data ? data.reduce((sum, item) => sum + item.amount_out, 0) : 0;

    return (
        <View className="flex-1 bg-background">
            <CustomHeader title="Day Book" showBack />

            <View className="flex-1">
                <View className="items-center py-3 bg-surface-hover">
                    <Text className="text-sm text-text-secondary font-medium">Date: {date}</Text>
                </View>

                {/* Summary for Day */}
                <View className="flex-row bg-surface p-4 border-b border-border">
                    <View className="flex-1 items-center">
                        <Text className="text-xs text-text-secondary">Total In</Text>
                        <Text className="text-base font-bold text-success">{formatCurrency(totalIn)}</Text>
                    </View>
                    <View className="flex-1 items-center">
                        <Text className="text-xs text-text-secondary">Total Out</Text>
                        <Text className="text-base font-bold text-danger">{formatCurrency(totalOut)}</Text>
                    </View>
                    <View className="flex-1 items-center">
                        <Text className="text-xs text-text-secondary">Net</Text>
                        <Text className="text-base font-bold text-text">{formatCurrency(totalIn - totalOut)}</Text>
                    </View>
                </View>

                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        ListEmptyComponent={<Text className="text-center mt-10 text-text-muted">No transactions for this date.</Text>}
                    />
                )}
            </View>
        </View>
    );
}
