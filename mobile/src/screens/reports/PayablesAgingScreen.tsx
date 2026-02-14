import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeftIcon, CheckCircleIcon } from "../../components/ui/UntitledIcons";
import { usePayablesAgingReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";

export function PayablesAgingScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { report, isLoading } = usePayablesAgingReport();

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    const bucketsOrder = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between p-4 bg-surface border-b border-border mt-6 android:mt-6">
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ArrowLeftIcon color={colors.text} size={24} />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-text">Payables Aging</Text>
                <View className="w-10" />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading data...</Text>
                ) : !report || report.totalDue === 0 ? (
                    <View className="items-center p-10">
                        <CheckCircleIcon size={48} color={colors.success} />
                        <Text className="text-lg font-semibold text-text-secondary mt-4">No pending bills.</Text>
                        <Text className="text-sm text-text-muted mt-1">You are all settled up with suppliers.</Text>
                    </View>
                ) : (
                    <>
                        {/* High Level Summary */}
                        <View className="bg-surface p-5 rounded-xl items-center mb-4 border border-border">
                            <Text className="text-sm text-text-muted mb-1">Total Payable</Text>
                            <Text className="text-3xl font-bold text-danger">{formatCurrency(report.totalDue)}</Text>
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

                        {/* Supplier Breakdown */}
                        <Text className="text-base font-semibold text-text mb-3">Supplier Breakdown</Text>
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
                                        return (
                                            <View key={range} className="bg-surface-hover px-2 py-1 rounded">
                                                <Text className="text-[10px] text-text-muted">{range}</Text>
                                                <Text className="text-xs font-semibold text-text">
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
