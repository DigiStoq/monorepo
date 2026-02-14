import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeftIcon, CalendarIcon } from "../../components/ui/UntitledIcons";
import type { DateRange } from "../../hooks/useReports";
import { useExpenseReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";

export function ExpenseReportScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useExpenseReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-surface p-4 rounded-xl border border-border shadow-sm">
            <View className="flex-row justify-between items-center mb-1">
                <Text className="text-base font-semibold text-text capitalize">{item.category || "Uncategorized"}</Text>
                <Text className="text-base font-semibold text-text">{formatCurrency(item.amount)}</Text>
            </View>
            <Text className="text-xs text-text-secondary">{item.count} transactions</Text>
        </View>
    );

    const total = data ? data.reduce((sum, item) => sum + item.amount, 0) : 0;

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between p-4 bg-surface border-b border-border mt-6 android:mt-6">
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ArrowLeftIcon color={colors.text} size={24} />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-text">Expense Report</Text>
                <TouchableOpacity className="p-2">
                    <CalendarIcon color={colors.textSecondary} size={24} />
                </TouchableOpacity>
            </View>

            <View className="flex-1">
                <View className="items-center py-3 bg-surface-hover">
                    <Text className="text-sm text-text-secondary font-medium">{dateRange.from} - {dateRange.to}</Text>
                </View>

                <View className="p-4 bg-surface items-center border-b border-border">
                    <Text className="text-sm text-text-secondary mb-1">Total Expenses</Text>
                    <Text className="text-2xl font-bold text-danger">{formatCurrency(total)}</Text>
                </View>

                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.category}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        ListEmptyComponent={<Text className="text-center mt-10 text-text-muted">No expenses found.</Text>}
                    />
                )}
            </View>
        </View>
    );
}
