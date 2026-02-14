import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeftIcon } from "../../components/ui/UntitledIcons";
import { useCustomerBalanceReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";

export function CustomerBalanceScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { data, isLoading } = useCustomerBalanceReport();

    const formatCurrency = (amount: number) => {
        return "$" + Math.abs(amount || 0).toFixed(2);
    };

    const renderItem = ({ item }: { item: any }) => {
        const isPositive = item.current_balance >= 0; // Receivable
        return (
            <TouchableOpacity
                className="bg-surface p-4 rounded-xl border border-border shadow-sm"
                onPress={() => { navigation.navigate('CustomerStatement', { customerId: item.id } as any); }}
            >
                <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-base font-semibold text-text">{item.name}</Text>
                    <Text className={`text-base font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(item.current_balance)} {isPositive ? '(Dr)' : '(Cr)'}
                    </Text>
                </View>
                <Text className="text-xs text-text-muted">{item.phone || 'No phone'}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between p-4 bg-surface border-b border-border mt-6 android:mt-6">
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ArrowLeftIcon color={colors.text} size={24} />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-text">Customer Balances</Text>
                <View className="w-10" />
            </View>

            <View className="flex-1">
                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        ListEmptyComponent={<Text className="text-center mt-10 text-text-muted">No balances found.</Text>}
                    />
                )}
            </View>
        </View>
    );
}
