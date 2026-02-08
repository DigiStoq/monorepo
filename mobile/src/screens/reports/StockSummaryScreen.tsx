import React, { useState, useMemo } from "react";
import { View, Text, FlatList, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SearchIcon, PackageIcon } from "../../components/ui/UntitledIcons";
import type { StockSummaryItem } from "../../hooks/useReports";
import { useStockSummaryReport } from "../../hooks/useReports";
import { CustomHeader } from "../../components/CustomHeader";
import { useTheme } from "../../contexts/ThemeContext";

export function StockSummaryScreen() {
    const navigation = useNavigation();
    const [search, setSearch] = useState("");
    const { colors } = useTheme();

    const { summary, isLoading } = useStockSummaryReport();

    const filteredItems = summary?.items.filter(item =>
        (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.sku || "").toLowerCase().includes(search.toLowerCase())
    ) || [];

    const formatCurrency = (amount: number) => "$" + (amount || 0).toFixed(2);

    const getStatusInfo = (status: StockSummaryItem['status']) => {
        switch (status) {
            case 'out-of-stock': return { color: colors.danger, label: 'Out of Stock' };
            case 'low-stock': return { color: colors.warning, label: 'Low Stock' };
            case 'in-stock': return { color: colors.success, label: 'In Stock' };
            default: return { color: colors.textMuted, label: '' };
        }
    };

    return (
        <View className="flex-1 bg-background">
            <CustomHeader title="Stock Summary" showBack />

            <View className="flex-1">
                {/* Overview Cards */}
                <View className="flex-row p-4 gap-4">
                    {isLoading ? <Text className="text-text-muted">Loading...</Text> : (
                        <>
                            <View className="flex-1 bg-surface p-4 rounded-lg border border-border shadow-sm">
                                <Text className="text-xs text-text-secondary mb-1">Total Value</Text>
                                <Text className="text-xl font-bold text-text mb-0.5">{formatCurrency(summary?.totalValue || 0)}</Text>
                                <Text className="text-[10px] text-text-muted">{summary?.totalItems || 0} Items</Text>
                            </View>
                            <View className="flex-1 bg-surface p-4 rounded-lg border border-border shadow-sm">
                                <Text className="text-xs text-text-secondary mb-1">Low Stock</Text>
                                <Text className="text-xl font-bold text-warning mb-0.5">{summary?.lowStockCount || 0}</Text>
                                <Text className="text-[10px] text-text-muted">Items needing reorder</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Search */}
                <View className="px-4 mb-4">
                    <View className="flex-row items-center bg-surface border border-border rounded-lg px-3 h-11">
                        <SearchIcon size={18} color={colors.textMuted} />
                        <TextInput
                            className="flex-1 ml-2 text-base text-text"
                            placeholder="Search item name or SKU..."
                            placeholderTextColor={colors.textMuted}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                {/* List */}
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40, paddingTop: 0 }}
                    renderItem={({ item }) => {
                        const status = getStatusInfo(item.status);
                        return (
                            <View className="bg-surface rounded-lg p-4 border border-border shadow-sm">
                                <View className="flex-row justify-between items-start mb-4">
                                    <View className="flex-1 mr-2">
                                        <Text className="text-base font-semibold text-text">{item.name}</Text>
                                        <Text className="text-xs text-text-muted mt-0.5">SKU: {item.sku}</Text>
                                    </View>
                                    <View className="px-2 py-1 rounded-sm" style={{ backgroundColor: status.color + '20' }}>
                                        <Text className="text-[10px] font-bold" style={{ color: status.color }}>
                                            {status.label}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row justify-between bg-surface-hover p-2 rounded-md">
                                    <View>
                                        <Text className="text-[10px] text-text-secondary mb-0.5">Stock Qty</Text>
                                        <Text className="text-sm font-semibold text-text">{item.stockQuantity}</Text>
                                    </View>
                                    <View>
                                        <Text className="text-[10px] text-text-secondary mb-0.5">Buy Price</Text>
                                        <Text className="text-sm font-semibold text-text">{formatCurrency(item.purchasePrice)}</Text>
                                    </View>
                                    <View>
                                        <Text className="text-[10px] text-text-secondary mb-0.5">Stock Value</Text>
                                        <Text className="text-sm font-semibold text-text">{formatCurrency(item.stockValue)}</Text>
                                    </View>
                                </View>
                            </View>
                        )
                    }}
                    ListEmptyComponent={
                        <View className="p-10 items-center justify-center gap-4">
                            <PackageIcon size={48} color={colors.border} />
                            <Text className="text-text-muted">{isLoading ? "Loading..." : "No items found"}</Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
}
