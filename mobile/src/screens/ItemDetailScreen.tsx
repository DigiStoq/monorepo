import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useItemById } from "../hooks/useItems";
import { useTheme } from "../contexts/ThemeContext";
import { BoxIcon, FileTextIcon, TrendingUpIcon, ChevronRightIcon, DollarSignIcon } from "../components/ui/UntitledIcons";
import { useQuery } from "@powersync/react-native";

export function ItemDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { id } = route.params || {};
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const { item, isLoading } = useItemById(id);

    // Stats Query
    const { data: statsData } = useQuery<{ totalSold: number; revenue: number }>(
        `SELECT 
      COALESCE(SUM(ii.quantity), 0) as totalSold,
      COALESCE(SUM(ii.quantity * ii.unit_price), 0) as revenue
     FROM sale_invoice_items ii
     JOIN sale_invoices i ON ii.invoice_id = i.id
     WHERE ii.item_id = ? AND i.status != 'cancelled'`,
        [id]
    );

    // Recent Sales
    const { data: salesHistory } = useQuery(
        `SELECT 'sale' as type, i.date, ii.quantity, ii.unit_price as price, i.invoice_number as reference
         FROM sale_invoice_items ii
         JOIN sale_invoices i ON ii.invoice_id = i.id
         WHERE ii.item_id = ? AND i.status != 'cancelled'
         ORDER BY i.date DESC LIMIT 5`,
        [id]
    );

    // Recent Purchases
    const { data: purchaseHistory } = useQuery(
        `SELECT 'purchase' as type, i.date, ii.quantity, ii.unit_price as price, i.invoice_number as reference
         FROM purchase_invoice_items ii
         JOIN purchase_invoices i ON ii.invoice_id = i.id
         WHERE ii.item_id = ? AND i.status != 'cancelled' 
         ORDER BY i.date DESC LIMIT 5`,
        [id]
    );

    const transactions = useMemo(() => {
        const all = [...(salesHistory || []), ...(purchaseHistory || [])];
        return all.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    }, [salesHistory, purchaseHistory]);

    const stats = statsData?.[0] || { totalSold: 0, revenue: 0 };

    if (isLoading || !item) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const handleEdit = () => {
        (navigation as any).navigate("ItemForm", { id: item.id });
    };

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between px-5 py-3 bg-surface border-b border-border">
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ChevronRightIcon size={24} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-text">{item.name}</Text>
                <TouchableOpacity onPress={handleEdit} className="p-2 bg-primary-10 rounded-md">
                    <Text className="text-primary font-semibold">Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>

                {/* Main Info Card */}
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    <View className="flex-row items-center mb-4">
                        <BoxIcon size={32} color={colors.primary} />
                        <View className="flex-1 ml-3">
                            <Text className="text-xs text-text-muted uppercase mb-1">SKU</Text>
                            <Text className="text-md font-medium text-text">{item.sku || "N/A"}</Text>
                        </View>
                        <View className={`px-3 py-1 rounded-full ${item.isActive ? 'bg-success-20' : 'bg-danger-20'}`} style={{ backgroundColor: item.isActive ? colors.success + '20' : colors.danger + '20' }}>
                            <Text className={`text-xs font-bold ${item.isActive ? 'text-success' : 'text-danger'}`} style={{ color: item.isActive ? colors.success : colors.danger }}>
                                {item.isActive ? "Active" : "Inactive"}
                            </Text>
                        </View>
                    </View>

                    <View className="h-[1px] bg-border my-4" />

                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Sale Price</Text>
                            <Text className="text-lg font-bold text-primary">${item.salePrice.toFixed(2)}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Purchase Price</Text>
                            <Text className="text-lg font-bold text-primary">${item.purchasePrice.toFixed(2)}</Text>
                        </View>
                    </View>
                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Stock Quantity</Text>
                            <Text className={`text-md font-medium ${item.stockQuantity <= (item.lowStockAlert || 0) ? 'text-warning' : 'text-text'}`} style={item.stockQuantity <= (item.lowStockAlert || 0) ? { color: colors.warning } : {}}>
                                {item.stockQuantity} {item.unit}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Tax Rate</Text>
                            <Text className="text-md font-medium text-text">{item.taxRate}%</Text>
                        </View>
                    </View>
                </View>

                {/* Stats Card */}
                <Text className="text-md font-bold text-text ml-1">Performance</Text>
                <View className="flex-row gap-4">
                    <View className="flex-1 bg-surface rounded-lg p-4 items-center shadow-sm">
                        <View className="mb-2 p-2 rounded-full bg-background">
                            <TrendingUpIcon size={20} color={colors.info} />
                        </View>
                        <Text className="text-xs text-text-muted">Total Sold</Text>
                        <Text className="text-xl font-bold text-text mt-1">{stats.totalSold}</Text>
                    </View>
                    <View className="flex-1 bg-surface rounded-lg p-4 items-center shadow-sm">
                        <View className="mb-2 p-2 rounded-full bg-background">
                            <DollarSignIcon size={20} color={colors.success} />
                        </View>
                        <Text className="text-xs text-text-muted">Total Revenue</Text>
                        <Text className="text-xl font-bold text-text mt-1">${stats.revenue.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Additional Info */}
                <Text className="text-md font-bold text-text ml-1">Specifications</Text>
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Brand</Text>
                            <Text className="text-md font-medium text-text">{item.brand || "—"}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Model</Text>
                            <Text className="text-md font-medium text-text">{item.modelNumber || "—"}</Text>
                        </View>
                    </View>
                    <View className="h-[1px] bg-border my-2" />
                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Batch No.</Text>
                            <Text className="text-md font-medium text-text">{item.batchNumber || "—"}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Barcode</Text>
                            <Text className="text-md font-medium text-text">{item.barcode || "—"}</Text>
                        </View>
                    </View>
                    <View className="h-[1px] bg-border my-2" />
                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Mfg Date</Text>
                            <Text className="text-md font-medium text-text">{item.manufactureDate ? new Date(item.manufactureDate).toLocaleDateString() : "—"}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Exp Date</Text>
                            <Text className="text-md font-medium text-text">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "—"}</Text>
                        </View>
                    </View>
                    <View className="h-[1px] bg-border my-2" />
                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">HSN Code</Text>
                            <Text className="text-md font-medium text-text">{item.hsnCode || "—"}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Warranty</Text>
                            <Text className="text-md font-medium text-text">{item.warrantyDays ? `${item.warrantyDays} Days` : "—"}</Text>
                        </View>
                    </View>
                    <View className="h-[1px] bg-border my-2" />
                    <View className="flex-row justify-between items-center">
                        <Text className="text-xs text-text-muted uppercase mb-1">Location</Text>
                        <Text className="text-md font-medium text-text">{item.location || "—"}</Text>
                    </View>
                    <View className="h-[1px] bg-border my-2" />
                    <View className="flex-row justify-between items-center">
                        <Text className="text-xs text-text-muted uppercase mb-1">Description</Text>
                        <Text className="text-md font-medium text-text">{item.description || "—"}</Text>
                    </View>
                </View>

                {/* Transaction History */}
                <Text className="text-md font-bold text-text ml-1">Transaction History</Text>
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    {(!transactions || transactions.length === 0) ? (
                        <Text className="p-4 text-text-muted text-center">No transactions found.</Text>
                    ) : (
                        transactions.map((txn: any, index: number) => (
                            <View key={`${txn.type}-${index}`}>
                                <View className="flex-row justify-between items-center mb-0">
                                    <View>
                                        <View className="flex-row items-center gap-2">
                                            <View className={`w-2 h-2 rounded-full ${txn.type === 'sale' ? 'bg-success' : 'bg-warning'}`} style={{ backgroundColor: txn.type === 'sale' ? colors.success : colors.warning }} />
                                            <Text className="text-sm font-bold text-text">{txn.reference || "Unknown"}</Text>
                                        </View>
                                        <Text className="text-xs text-text-muted mt-1">{new Date(txn.date).toLocaleDateString()}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className={`text-sm font-bold ${txn.type === 'sale' ? 'text-danger' : 'text-success'}`} style={{ color: txn.type === 'sale' ? colors.danger : colors.success }}>
                                            {txn.type === 'sale' ? '-' : '+'}{txn.quantity}
                                        </Text>
                                        <Text className="text-xs text-text-muted">@ ${txn.price?.toFixed(2)}</Text>
                                    </View>
                                </View>
                                {index < transactions.length - 1 && <View className="h-[1px] bg-border my-3" />}
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>
        </View>
    );
}
