import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { ReportScreenLayout } from "../../components/reports/ReportScreenLayout";
import type { DateRange } from "../../hooks/useReports";
import { useTaxSummaryReport } from "../../hooks/useReports";

export function TaxSummaryScreen() {

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { data: reportData, isLoading } = useTaxSummaryReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    return (
        <ReportScreenLayout title="Tax Summary" dateRange={dateRange} onDateRangeChange={setDateRange}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading...</Text>
                ) : !reportData ? (
                    <Text className="text-center mt-10 text-text-muted">No tax data.</Text>
                ) : (
                    <>
                        <View className="bg-surface p-5 rounded-xl border border-border items-center shadow-sm">
                            <Text className="text-base font-semibold text-text mb-1">Tax Collected (Output)</Text>
                            <Text className="text-xs text-text-muted mb-3">From Sales</Text>
                            <Text className="text-3xl font-bold text-success">+{formatCurrency(reportData.taxCollected)}</Text>
                        </View>

                        <View className="bg-surface p-5 rounded-xl border border-border items-center shadow-sm">
                            <Text className="text-base font-semibold text-text mb-1">Tax Paid (Input)</Text>
                            <Text className="text-xs text-text-muted mb-3">From Purchases</Text>
                            <Text className="text-3xl font-bold text-danger">-{formatCurrency(reportData.taxPaid)}</Text>
                        </View>

                        <View className="bg-primary/10 p-5 rounded-xl border border-primary items-center shadow-sm">
                            <Text className="text-base font-semibold text-text mb-1">Net Tax Payable</Text>
                            <Text className={`text-3xl font-bold ${reportData.netTax >= 0 ? 'text-success' : 'text-danger'}`}>
                                {formatCurrency(reportData.netTax)}
                            </Text>
                            <Text className="text-xs text-primary mt-2">
                                {reportData.netTax > 0 ? "You owe this amount to tax authority." : "You have a tax credit."}
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </ReportScreenLayout>
    );
}
