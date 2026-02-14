import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CustomHeader } from "../components/CustomHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { useLoans } from "../hooks/useLoans";
import { CoinsHandIcon } from "../components/ui/UntitledIcons";

export function LoansScreen() {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'given' | 'taken'>('all');
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    const { loans, isLoading } = useLoans({
        type: filterType === 'all' ? undefined : filterType
    });

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => { setRefreshing(false); }, 1000);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'closed': return colors.success;
            case 'defaulted': return colors.danger;
            default: return colors.info; // blue (active)
        }
    };

    return (
        <View className="flex-1 bg-background-light">
            <CustomHeader title="Loans" showBack />

            <View className="px-5 py-3">
                <View className="flex-row gap-2">
                    {['all', 'given', 'taken'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            className={`px-4 py-2 rounded-full ${filterType === type ? 'bg-primary' : 'bg-surface-hover'}`}
                            style={{ backgroundColor: filterType === type ? colors.primary : colors.surface + '20' }}
                            onPress={() => { setFilterType(type as any); }}
                        >
                            <Text className={`text-sm font-medium ${filterType === type ? 'text-white' : 'text-text-secondary'}`}>
                                {type === 'all' ? 'All Loans' : type === 'given' ? 'Given (Assets)' : 'Taken (Liabilities)'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* List */}
            <FlatList
                data={loans || []}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
                }
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 12 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className="bg-surface rounded-lg p-4 shadow-sm"
                        onPress={() => (navigation as any).navigate("LoanForm", { id: item.id })}
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center gap-4 mb-4">
                            <View
                                className="w-11 h-11 rounded-full items-center justify-center"
                                style={{
                                    backgroundColor: item.type === 'given' ? colors.success + '20' : colors.danger + '20'
                                }}
                            >
                                <CoinsHandIcon color={item.type === 'given' ? colors.success : colors.danger} size={20} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-md font-semibold text-text">{item.type === 'given' ? item.customerName : item.lenderName}</Text>
                                <Text className="text-sm text-text-muted mt-0.5">{item.type === 'given' ? 'Money Lent' : 'Money Borrowed'}</Text>
                            </View>
                            <View
                                className="px-2 py-0.5 rounded-sm"
                                style={{ backgroundColor: getStatusColor(item.status || 'active') + '20' }}
                            >
                                <Text
                                    className="text-xs font-semibold capitalize"
                                    style={{ color: getStatusColor(item.status || 'active') }}
                                >
                                    {item.status || 'Active'}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row justify-between mb-4 px-1">
                            <View>
                                <Text className="text-sm text-text-muted mb-0.5">Principal</Text>
                                <Text className="text-md font-bold text-text">${(item.principalAmount || 0).toFixed(2)}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-sm text-text-muted mb-0.5">Outstanding</Text>
                                <Text
                                    className="text-md font-bold"
                                    style={{ color: (item.outstandingAmount || 0) > 0 ? colors.warning : colors.success }}
                                >
                                    ${(item.outstandingAmount || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        <View className="bg-background p-2 rounded-md items-center border border-border">
                            <Text className="text-sm text-text-secondary font-medium">
                                {item.interestRate}% Interest • {item.paidEmis || 0}/{item.totalEmis || 0} EMIs Paid
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="items-center p-10">
                        <Text className="text-text-muted text-md">No loans found</Text>
                    </View>
                }
            />

            {/* FAB */}
            <TouchableOpacity
                className="absolute right-5 bg-primary px-5 py-3 rounded-full shadow-md"
                style={{ bottom: insets.bottom + 80, backgroundColor: colors.primary }}
                onPress={() => (navigation as any).navigate("LoanForm")}
            >
                <Text className="text-white font-semibold text-md bg-transparent">+ Add</Text>
            </TouchableOpacity>
        </View>
    );
}
