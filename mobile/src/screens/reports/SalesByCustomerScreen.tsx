import React, { useState, useMemo } from "react";
import { View, Text, FlatList, TextInput } from "react-native";
import { ReportScreenLayout } from "../../components/reports/ReportScreenLayout";
import { SearchIcon } from "../../components/ui/UntitledIcons";
import type { DateRange } from "../../hooks/useReports";
import { useSalesByCustomerReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";

export function SalesByCustomerScreen() {
    const { colors } = useTheme();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });
    const [search, setSearch] = useState("");

    const { data, isLoading } = useSalesByCustomerReport(dateRange);

    const filteredData = data.filter(item =>
        (item.customerName || "").toLowerCase().includes(search.toLowerCase())
    );

    const maxAmount = filteredData.length > 0 ? Math.max(...filteredData.map(d => d.totalAmount)) : 1;

    const formatCurrency = (amount: number) => "$" + (amount || 0).toFixed(2);

    return (
        <ReportScreenLayout title="Sales by Customer" dateRange={dateRange} onDateRangeChange={setDateRange}>
            {/* Filter Section */}
            <View className="p-4 bg-surface border-b border-border">
                <View className="flex-row items-center bg-surface-hover rounded-lg px-3 h-10">
                    <SearchIcon size={18} color={colors.textMuted} />
                    <TextInput
                        className="flex-1 ml-2 h-full text-base text-text"
                        placeholder="Search customers..."
                        placeholderTextColor={colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.customerId || item.customerName}
                contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
                renderItem={({ item, index }) => (
                    <View className="bg-surface rounded-xl p-4 border border-border shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <Text className="text-sm text-text-muted w-8 font-medium">#{index + 1}</Text>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-text">{item.customerName}</Text>
                                <Text className="text-xs text-text-muted">{item.invoiceCount} invoices</Text>
                            </View>
                            <Text className="text-base font-bold text-text">{formatCurrency(item.totalAmount)}</Text>
                        </View>

                        {/* Progress Bar */}
                        <View className="h-1.5 bg-surface-hover rounded-full overflow-hidden mb-3">
                            <View className="h-full bg-primary rounded-full" style={{ width: `${(item.totalAmount / maxAmount) * 100}%` }} />
                        </View>

                        <View className="flex-row justify-between">
                            <Text className="text-xs font-medium text-success">Paid: {formatCurrency(item.paidAmount)}</Text>
                            <Text className="text-xs font-medium text-danger">Due: {formatCurrency(item.dueAmount)}</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View className="p-10 items-center">
                        <Text className="text-text-muted">{isLoading ? "Loading..." : "No available data"}</Text>
                    </View>
                }
            />
        </ReportScreenLayout>
    );
}
