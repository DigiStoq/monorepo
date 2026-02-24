import React from "react";
import { View, Text, FlatList } from "react-native";
import { CustomHeader } from "../../components/CustomHeader";
import { useLowStockReport } from "../../hooks/useReports";

export function LowStockScreen() {
    const { data, isLoading } = useLowStockReport();

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-surface p-4 rounded-xl border border-danger/40 shadow-sm">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-base font-semibold text-text">{item.name}</Text>
                <View className="bg-danger/20 px-2 py-0.5 rounded">
                    <Text className="text-[10px] text-danger font-bold">Low Stock</Text>
                </View>
            </View>
            <View className="flex-row justify-between">
                <Text className="text-sm text-text-secondary">
                    Current: <Text className="font-bold text-danger">{item.stock_quantity}</Text>
                </Text>
                <Text className="text-xs text-text-muted">Reorder Level: {item.low_stock_alert}</Text>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            <CustomHeader title="Low Stock Alert" showBack />

            <View className="flex-1">
                {isLoading ? (
                    <Text className="text-center mt-10 text-text-muted">Loading...</Text>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        ListEmptyComponent={
                            <View className="items-center mt-10">
                                <Text className="text-text-secondary text-base text-center">All items are well stocked.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
}
