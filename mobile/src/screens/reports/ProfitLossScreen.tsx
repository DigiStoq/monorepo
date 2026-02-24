import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { ReportScreenLayout } from "../../components/reports/ReportScreenLayout";
import type { DateRange } from "../../hooks/useReports";
import { useProfitLossReport } from "../../hooks/useReports";

export function ProfitLossScreen() {

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data, isLoading } = useProfitLossReport(dateRange);

    const formatCurrency = (amount: number) => "$" + (amount || 0).toFixed(2);

    return (
        <ReportScreenLayout title="Profit & Loss" dateRange={dateRange} onDateRangeChange={setDateRange}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading data...</Text>
                ) : !data ? (
                    <Text className="text-center mt-10 text-text-muted">No data available</Text>
                ) : (
                    <>
                        {/* Net Profit Big Card */}
                        <View className="bg-surface rounded-xl p-6 items-center mb-6 border border-border shadow-md">
                            <Text className="text-sm text-text-secondary uppercase tracking-wide mb-2">Net Profit</Text>
                            <Text className={`text-3xl font-bold mb-1 ${data.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                                {formatCurrency(data.netProfit)}
                            </Text>
                            <Text className="text-sm text-text-muted">
                                {data.netProfit >= 0 ? 'Profit' : 'Loss'} for this period
                            </Text>
                        </View>

                        {/* Revenue Section */}
                        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
                            <View className="flex-row justify-between mb-3 border-b border-border pb-2">
                                <Text className="text-base font-semibold text-text">Revenue</Text>
                                <Text className="text-base font-semibold text-text">{formatCurrency(data.revenue.total)}</Text>
                            </View>
                            {data.revenue.breakdown.map((item, i) => (
                                <View key={i} className="flex-row justify-between mb-2">
                                    <Text className="text-sm text-text-secondary">{item.category}</Text>
                                    <Text className="text-sm text-text-secondary font-medium">{formatCurrency(item.amount)}</Text>
                                </View>
                            ))}
                        </View>

                        {/* COGS Section */}
                        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
                            <View className="flex-row justify-between mb-3 border-b border-border pb-2">
                                <Text className="text-base font-semibold text-text">Cost of Goods Sold</Text>
                                <Text className="text-base font-semibold text-danger">({formatCurrency(data.cogs.total)})</Text>
                            </View>
                            {data.cogs.breakdown.map((item, i) => (
                                <View key={i} className="flex-row justify-between mb-2">
                                    <Text className="text-sm text-text-secondary">{item.category}</Text>
                                    <Text className="text-sm text-text-secondary font-medium">{formatCurrency(item.amount)}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Gross Profit Line */}
                        <View className="flex-row justify-between p-4 bg-surface-hover rounded-xl mb-4">
                            <Text className="text-base font-semibold text-text-secondary">Gross Profit</Text>
                            <Text className="text-base font-bold text-text-secondary">{formatCurrency(data.grossProfit)}</Text>
                        </View>

                        {/* Expenses Section */}
                        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
                            <View className="flex-row justify-between mb-3 border-b border-border pb-2">
                                <Text className="text-base font-semibold text-text">Operating Expenses</Text>
                                <Text className="text-base font-semibold text-danger">({formatCurrency(data.expenses.total)})</Text>
                            </View>
                            {data.expenses.breakdown.length === 0 && <Text className="text-center text-border text-sm italic">No expenses recorded</Text>}
                            {data.expenses.breakdown.map((item, i) => (
                                <View key={i} className="flex-row justify-between mb-2">
                                    <Text className="text-sm text-text-secondary">{item.category}</Text>
                                    <Text className="text-sm text-text-secondary font-medium">{formatCurrency(item.amount)}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Net Profit Line */}
                        <View className="flex-row justify-between p-4 bg-text rounded-xl mb-4">
                            <Text className="text-base font-bold text-background">Net Profit</Text>
                            <Text className={`text-lg font-bold ${data.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                                {formatCurrency(data.netProfit)}
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </ReportScreenLayout>
    );
}
