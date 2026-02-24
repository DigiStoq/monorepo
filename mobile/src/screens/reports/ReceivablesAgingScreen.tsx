import React from "react";
import { View, Text, ScrollView } from "react-native";
import { CustomHeader } from "../../components/CustomHeader";
import { AlertTriangleIcon } from "../../components/ui/UntitledIcons";
import { useReceivablesAgingReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";

export function ReceivablesAgingScreen() {
    const { colors } = useTheme();
    const { report, isLoading } = useReceivablesAgingReport();

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const bucketsOrder = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];

    return (
        <View className="flex-1 bg-background">
            <CustomHeader title="Receivables Aging" showBack />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading data...</Text>
                ) : !report || report.totalDue === 0 ? (
                    <View className="items-center p-10">
                        <AlertTriangleIcon size={48} color={colors.textMuted} />
                        <Text className="text-lg font-semibold text-text-secondary mt-4">No overdue invoices.</Text>
                        <Text className="text-sm text-text-muted mt-1">Great job! All payments are up to date.</Text>
                    </View>
                ) : (
                    <>
                        {/* High Level Summary */}
                        <View className="bg-surface p-5 rounded-xl items-center mb-4 border border-border">
                            <Text className="text-sm text-text-muted mb-1">Total Overdue</Text>
                            <Text className="text-3xl font-bold text-text">{formatCurrency(report.totalDue)}</Text>
                        </View>

                        {/* Buckets */}
                        <View className="flex-row flex-wrap gap-2 mb-6">
                            {bucketsOrder.map(range => {
                                const bucket = report.buckets.find(b => b.range === range);
                                const amount = bucket ? bucket.amount : 0;
                                const isHigh = amount > 0 && range !== 'Current';
                                return (
                                    <View key={range} className="w-[48%] bg-surface p-3 rounded-lg border border-border">
                                        <Text className="text-xs text-text-muted mb-1">{range}</Text>
                                        <Text className={`text-base font-semibold ${isHigh ? 'text-danger' : 'text-text'}`}>
                                            {formatCurrency(amount)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Customer Breakdown */}
                        <Text className="text-base font-semibold text-text mb-3">Customer Breakdown</Text>
                        {report.customers.map(customer => (
                            <View key={customer.id} className="bg-surface p-4 rounded-xl border border-border mb-3 shadow-sm">
                                <View className="flex-row justify-between mb-3">
                                    <Text className="text-base font-semibold text-text">{customer.name}</Text>
                                    <Text className="text-base font-bold text-text">{formatCurrency(customer.totalDue)}</Text>
                                </View>
                                <View className="flex-row flex-wrap gap-3">
                                    {bucketsOrder.map(range => {
                                        const bucket = customer.buckets.find(b => b.range === range);
                                        if (!bucket || bucket.amount === 0) return null;
                                        const isLate = range !== 'Current';
                                        return (
                                            <View key={range} className="bg-surface-hover px-2 py-1 rounded">
                                                <Text className="text-[10px] text-text-muted">{range}</Text>
                                                <Text className={`text-xs font-semibold ${isLate ? 'text-danger' : 'text-text'}`}>
                                                    {formatCurrency(bucket.amount)}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </View>
    );
}
