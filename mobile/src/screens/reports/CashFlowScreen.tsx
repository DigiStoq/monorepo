import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { ReportScreenLayout } from "../../components/reports/ReportScreenLayout";
import { TrendingUpIcon, TrendingDownIcon, WalletIcon } from "../../components/ui/UntitledIcons";
import type { DateRange } from "../../hooks/useReports";
import { useCashFlowReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";

export function CashFlowScreen() {
    const { colors } = useTheme();

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useCashFlowReport(dateRange);

    const formatCurrency = (amount: number) => "$" + (amount || 0).toFixed(2);

    return (
        <ReportScreenLayout title="Cash Flow Statement" dateRange={dateRange} onDateRangeChange={setDateRange}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading data...</Text>
                ) : !data ? (
                    <Text className="text-center mt-10 text-text-muted">No data available</Text>
                ) : (
                    <>
                        {/* Net Cash Flow Card */}
                        <View className="bg-surface rounded-xl p-6 items-center mb-6 border border-border shadow-md">
                            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
                                <WalletIcon color={colors.primary} size={24} />
                            </View>
                            <Text className="text-sm text-text-secondary uppercase tracking-wide mb-1">Net Cash Flow</Text>
                            <Text className={`text-3xl font-bold mb-1 ${data.netCashFlow >= 0 ? 'text-primary' : 'text-danger'}`}>
                                {data.netCashFlow >= 0 ? '+' : ''}{formatCurrency(data.netCashFlow)}
                            </Text>
                            <Text className="text-sm text-text-muted">
                                {data.netCashFlow >= 0 ? 'Surplus' : 'Deficit'} for this period
                            </Text>
                        </View>

                        <View className="flex-row gap-3 mb-6">
                            {/* Inflows Summary */}
                            <View className="flex-1 p-4 rounded-xl border bg-success/10 border-success/30">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-sm font-semibold text-success">Inflows</Text>
                                    <TrendingUpIcon size={16} color={colors.success} />
                                </View>
                                <Text className="text-lg font-bold text-success">{formatCurrency(data.inflows.total)}</Text>
                            </View>

                            {/* Outflows Summary */}
                            <View className="flex-1 p-4 rounded-xl border bg-danger/10 border-danger/30">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-sm font-semibold text-danger">Outflows</Text>
                                    <TrendingDownIcon size={16} color={colors.danger} />
                                </View>
                                <Text className="text-lg font-bold text-danger">{formatCurrency(data.outflows.total)}</Text>
                            </View>
                        </View>

                        {/* Inflows Breakdown */}
                        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
                            <View className="mb-4 border-b border-border pb-2">
                                <Text className="text-base font-semibold text-text">Cash In</Text>
                            </View>
                            {data.inflows.breakdown.length === 0 && <Text className="text-center text-border text-sm italic">No inflows recorded</Text>}
                            {data.inflows.breakdown.map((item, i) => (
                                <View key={i} className="flex-row justify-between mb-3">
                                    <View className="flex-row items-center gap-2">
                                        <View className="w-2 h-2 rounded-full bg-success" />
                                        <Text className="text-sm text-text-secondary">{item.category}</Text>
                                    </View>
                                    <Text className="text-sm text-text font-medium">{formatCurrency(item.amount)}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Outflows Breakdown */}
                        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
                            <View className="mb-4 border-b border-border pb-2">
                                <Text className="text-base font-semibold text-text">Cash Out</Text>
                            </View>
                            {data.outflows.breakdown.length === 0 && <Text className="text-center text-border text-sm italic">No outflows recorded</Text>}
                            {data.outflows.breakdown.map((item, i) => (
                                <View key={i} className="flex-row justify-between mb-3">
                                    <View className="flex-row items-center gap-2">
                                        <View className="w-2 h-2 rounded-full bg-danger" />
                                        <Text className="text-sm text-text-secondary">{item.category}</Text>
                                    </View>
                                    <Text className="text-sm text-text font-medium">{formatCurrency(item.amount)}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>
        </ReportScreenLayout>
    );
}
