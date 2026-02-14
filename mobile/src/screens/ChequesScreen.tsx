import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowUpRightIcon, ArrowDownLeftIcon, PlusIcon } from "../components/ui/UntitledIcons";
import { CustomHeader } from "../components/CustomHeader";
import { useTheme } from "../contexts/ThemeContext";
import { useCheques } from "../hooks/useCheques";

export function ChequesScreen() {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'received' | 'issued'>('all');
    const { colors } = useTheme();

    const { cheques } = useCheques({
        type: filterType === 'all' ? undefined : filterType
    });

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => { setRefreshing(false); }, 1000);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'cleared': return colors.success;
            case 'bounced': return colors.danger;
            case 'cancelled': return colors.textMuted;
            default: return colors.warning;
        }
    };

    return (
        <View className="flex-1 bg-background relative">
            <CustomHeader title="Cheques" showBack />

            <View className="px-5 py-4">
                <View className="flex-row gap-2">
                    {['all', 'received', 'issued'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            className={`px-4 py-2 rounded-full ${filterType === type ? 'bg-primary' : 'bg-surface-hover'}`}
                            style={{ backgroundColor: filterType === type ? colors.primary : colors.surfaceHover }}
                            onPress={() => { setFilterType(type as any); }}
                        >
                            <Text className={`text-sm font-medium ${filterType === type ? 'text-white' : 'text-text-secondary'}`}
                                style={{ color: filterType === type ? '#ffffff' : colors.textSecondary }}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <FlatList
                data={cheques || []}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
                }
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 12 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className="bg-surface rounded-lg p-4 shadow-sm"
                        onPress={() => (navigation as any).navigate("ChequeForm", { id: item.id })}
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center gap-4 mb-4">
                            <View className="w-10 h-10 rounded-full items-center justify-center"
                                style={{ backgroundColor: item.type === 'received' ? colors.success + '20' : colors.danger + '20' }}>
                                {item.type === 'received'
                                    ? <ArrowDownLeftIcon color={colors.success} size={20} />
                                    : <ArrowUpRightIcon color={colors.danger} size={20} />
                                }
                            </View>
                            <View className="flex-1">
                                <Text className="text-md font-semibold text-text">{item.customerName || 'Unknown Party'}</Text>
                                <Text className="text-sm text-text-muted mt-0.5">{item.bankName} • {item.chequeNumber}</Text>
                            </View>
                            <View className="px-2 py-0.5 rounded-sm" style={{ backgroundColor: getStatusColor(item.status || 'pending') + '20' }}>
                                <Text className="text-xs font-semibold capitalize" style={{ color: getStatusColor(item.status || 'pending') }}>
                                    {item.status || 'Pending'}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-row justify-between items-center pt-4 border-t border-border">
                            <Text className="text-sm text-text-muted">Due: {item.dueDate || item.date}</Text>
                            <Text className="text-md font-bold text-text">${(item.amount || 0).toFixed(2)}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="items-center py-10">
                        <Text className="text-text-muted text-md">No cheques found</Text>
                    </View>
                }
            />

            <TouchableOpacity
                className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
                style={{ backgroundColor: colors.primary }}
                onPress={() => (navigation as any).navigate("ChequeForm")}
            >
                <PlusIcon size={24} color="#ffffff" />
            </TouchableOpacity>
        </View>
    );
}
