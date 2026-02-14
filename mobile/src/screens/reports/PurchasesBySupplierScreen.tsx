import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CalendarIcon } from "../../components/ui/UntitledIcons";
import type { DateRange } from "../../hooks/useReports";
import { usePurchasesBySupplierReport } from "../../hooks/useReports";
import { CustomHeader } from "../../components/CustomHeader";
import { useTheme } from "../../contexts/ThemeContext";

export function PurchasesBySupplierScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = usePurchasesBySupplierReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-surface p-4 rounded-xl border border-border shadow-sm">
            <View className="flex-row justify-between items-center mb-1">
                <Text className="text-base font-semibold text-text">{item.supplier_name}</Text>
                <Text className="text-base font-bold text-text">{formatCurrency(item.total_amount)}</Text>
            </View>
            <Text className="text-sm text-text-muted">{item.invoice_count} invoices</Text>
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            <CustomHeader title="Purchase By Supplier" showBack />

            <View className="flex-1">
                <View className="flex-row items-center justify-center py-3 bg-surface-hover">
                    <CalendarIcon color={colors.textMuted} size={16} />
                    <Text className="text-sm text-text-secondary font-medium ml-1.5">{dateRange.from} - {dateRange.to}</Text>
                </View>

                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.supplier_id}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        ListEmptyComponent={<Text className="text-center mt-10 text-text-muted">No purchases found.</Text>}
                    />
                )}
            </View>
        </View>
    );
}
