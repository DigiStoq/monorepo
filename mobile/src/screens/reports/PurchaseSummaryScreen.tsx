import type React from "react";
import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
    ArrowLeftIcon,
    CalendarIcon,
    DollarSignIcon,
    FileTextIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    UsersIcon,
} from "../../components/ui/UntitledIcons";
import type { DateRange } from "../../hooks/useReports";
import { usePurchaseSummaryReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";

export function PurchaseSummaryScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { summary, isLoading } = usePurchaseSummaryReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    // Derived stats
    const paidPercent = summary && summary.totalPurchases > 0
        ? ((summary.totalPaid / summary.totalPurchases) * 100).toFixed(1)
        : "0";

    const outstandingPercent = summary && summary.totalPurchases > 0
        ? ((summary.totalDue / summary.totalPurchases) * 100).toFixed(1)
        : "0";

    const maxMonthAmount = summary?.purchasesByMonth.reduce((max, m) => Math.max(max, m.amount), 0) || 1;
    const maxSupplierAmount = summary?.topSuppliers.reduce((max, c) => Math.max(max, c.amount), 0) || 1;

    function Card({
        children,
        className,
    }: {
        children: React.ReactNode;
        className?: string;
    }) {
        return (
            <View className={`bg-surface rounded-xl border border-border p-4 shadow-sm ${className}`}>
                {children}
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between p-4 bg-surface border-b border-border mt-6 android:mt-6">
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ArrowLeftIcon color={colors.text} size={24} />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-text">Purchase Summary</Text>
                <TouchableOpacity className="p-2">
                    <CalendarIcon color={colors.textSecondary} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}>
                {/* Date Display */}
                <View className="items-center mb-2">
                    <Text className="text-sm text-text-secondary font-medium">{dateRange.from} - {dateRange.to}</Text>
                </View>

                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading data...</Text>
                ) : !summary ? (
                    <Text className="text-center mt-10 text-text-muted">No data found.</Text>
                ) : (
                    <>
                        {/* Summary Grid */}
                        <View className="flex-row gap-3">
                            {/* Total Purchases */}
                            <Card className="flex-1">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-xs text-text-secondary font-medium">Total Purchases</Text>
                                    <View className="p-1.5 rounded-lg bg-warning/20">
                                        <DollarSignIcon size={16} color={colors.warning} />
                                    </View>
                                </View>
                                <Text className="text-lg font-bold text-text mb-1">{formatCurrency(summary.totalPurchases)}</Text>
                                <Text className="text-[11px] text-text-muted">{summary.totalInvoices} invoices</Text>
                            </Card>

                            {/* Total Due */}
                            <Card className="flex-1">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-xs text-text-secondary font-medium">Amount Due</Text>
                                    <View className="p-1.5 rounded-lg bg-danger/20">
                                        <TrendingDownIcon size={16} color={colors.danger} />
                                    </View>
                                </View>
                                <Text className="text-lg font-bold text-danger mb-1">{formatCurrency(summary.totalDue)}</Text>
                                <Text className="text-[11px] text-text-muted">{outstandingPercent}% outstanding</Text>
                            </Card>
                        </View>

                        <View className="flex-row gap-3">
                            {/* Total Paid */}
                            <Card className="flex-1">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-xs text-text-secondary font-medium">Paid</Text>
                                    <View className="p-1.5 rounded-lg bg-success/20">
                                        <TrendingUpIcon size={16} color={colors.success} />
                                    </View>
                                </View>
                                <Text className="text-lg font-bold text-success mb-1">{formatCurrency(summary.totalPaid)}</Text>
                                <Text className="text-[11px] text-text-muted">{paidPercent}% paid</Text>
                            </Card>
                        </View>

                        {/* Monthly Trend */}
                        <Card className="mb-2">
                            <Text className="text-base font-semibold text-text mb-3">Purchase Trend</Text>
                            <View className="flex-row h-[120px] items-end gap-2 pt-2">
                                {summary.purchasesByMonth.length === 0 ? <Text className="text-center text-text-muted p-5 w-full">No trend data</Text> :
                                    summary.purchasesByMonth.map((m, i) => (
                                        <View key={i} className="flex-1 items-center gap-1">
                                            <View className="w-3 bg-warning rounded" style={{ height: `${Math.max(4, (m.amount / maxMonthAmount) * 100)}%` }} />
                                            <Text className="text-[10px] text-text-muted">{m.month}</Text>
                                        </View>
                                    ))}
                            </View>
                        </Card>

                        {/* Top Suppliers */}
                        <Card className="mb-2">
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-base font-semibold text-text">Top Suppliers</Text>
                                <UsersIcon size={16} color={colors.textMuted} />
                            </View>
                            <View className="gap-3">
                                {summary.topSuppliers.length === 0 ? <Text className="text-center text-text-muted p-5">No suppliers found</Text> :
                                    summary.topSuppliers.map((c, i) => (
                                        <View key={c.supplierId} className="gap-1.5">
                                            <View className="flex-row justify-between">
                                                <Text className="text-sm text-text-secondary font-medium flex-1">{i + 1}. {c.supplierName}</Text>
                                                <Text className="text-sm text-text font-semibold">{formatCurrency(c.amount)}</Text>
                                            </View>
                                            <View className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                                                <View className="h-full bg-warning rounded-full" style={{ width: `${(c.amount / maxSupplierAmount) * 100}%` }} />
                                            </View>
                                        </View>
                                    ))}
                            </View>
                        </Card>
                    </>
                )}
            </ScrollView>
        </View>
    );
}
