import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeftIcon, CalendarIcon } from "../../components/ui/UntitledIcons";
import type { DateRange } from "../../hooks/useReports";
import { usePurchaseRegisterReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";

export function PurchaseRegisterScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = usePurchaseRegisterReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return { bg: 'bg-success/20', text: 'text-success' };
            case 'partial': return { bg: 'bg-warning/20', text: 'text-warning' };
            case 'sent': return { bg: 'bg-primary/20', text: 'text-primary' };
            case 'cancelled': return { bg: 'bg-danger/20', text: 'text-danger' };
            default: return { bg: 'bg-surface-hover', text: 'text-text-secondary' };
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const statusStyle = getStatusStyle(item.status);
        return (
            <TouchableOpacity className="bg-surface p-4 rounded-xl border border-border shadow-sm">
                <View className="flex-row justify-between mb-2">
                    <View>
                        <Text className="text-base font-semibold text-text">{item.invoice_number}</Text>
                        <Text className="text-xs text-text-muted">{item.date}</Text>
                    </View>
                    <View className={`px-2 py-0.5 rounded ${statusStyle.bg}`}>
                        <Text className={`text-[10px] font-semibold capitalize ${statusStyle.text}`}>{item.status}</Text>
                    </View>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm text-text-secondary">{item.customer_name}</Text>
                    <Text className="text-base font-bold text-text">{formatCurrency(item.total)}</Text>
                </View>
                <View className="flex-row justify-between border-t border-border pt-2">
                    <Text className="text-xs text-success">Paid: {formatCurrency(item.amount_paid)}</Text>
                    {item.amount_due > 0 && <Text className="text-xs text-danger">Due: {formatCurrency(item.amount_due)}</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between p-4 bg-surface border-b border-border mt-6 android:mt-6">
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ArrowLeftIcon color={colors.text} size={24} />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-text">Purchase Register</Text>
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
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        ListEmptyComponent={<Text className="text-center mt-10 text-text-muted">No purchases found in this period.</Text>}
                    />
                )}
            </View>
        </View>
    );
}
