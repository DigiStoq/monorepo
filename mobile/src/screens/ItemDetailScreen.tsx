import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useItemById, useItemMutations } from "../hooks/useItems";
import { useTheme } from "../contexts/ThemeContext";
import { BoxIcon, TrendingUpIcon, ChevronRightIcon, DollarSignIcon, RefreshCw01Icon } from "../components/ui/UntitledIcons";
import { useQuery } from "@powersync/react-native";

export function ItemDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { id } = route.params || {};
    const { colors } = useTheme();

    const { item, isLoading } = useItemById(id);
    const { adjustStock } = useItemMutations();

    const [isAdjusting, setIsAdjusting] = useState(false);
    const [adjustmentQty, setAdjustmentQty] = useState("");
    const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
    const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

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

    const { data: transactions } = useQuery<{ type: string; date: string; quantity: number; price: number; reference: string; }>(
        `SELECT 'sale' as type, i.date, ii.quantity, ii.unit_price as price, i.invoice_number as reference
         FROM sale_invoice_items ii
         JOIN sale_invoices i ON ii.invoice_id = i.id
         WHERE ii.item_id = ? AND i.status != 'cancelled'
         
         UNION ALL
         
         SELECT 'purchase' as type, i.date, ii.quantity, ii.unit_price as price, i.invoice_number as reference
         FROM purchase_invoice_items ii
         JOIN purchase_invoices i ON ii.invoice_id = i.id
         WHERE ii.item_id = ? AND i.status != 'cancelled'

         UNION ALL

         SELECT 'adjustment' as type, ih.created_at as date, CAST(json_extract(ih.new_values, '$.adjustment') AS REAL) as quantity, 0 as price, 'Manual Adj' as reference
         FROM item_history ih
         WHERE ih.item_id = ? AND ih.action = 'stock_adjusted'
         
         ORDER BY date DESC LIMIT 20`,
        [id, id, id]
    );

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

    const handleAdjustStock = async () => {
        const qty = parseFloat(adjustmentQty);
        if (isNaN(qty) || qty <= 0) {
            Alert.alert("Invalid Quantity", "Please enter a valid positive number.");
            return;
        }

        const finalQty = adjustmentType === 'add' ? qty : -qty;

        // Check standard stock constraints if needed (e.g. don't go below 0)
        if (item.stockQuantity + finalQty < 0) {
            Alert.alert("Invalid Adjustment", `Cannot remove ${qty}. Current stock is ${item.stockQuantity}.`);
            return;
        }

        setIsSubmittingAdjustment(true);
        try {
            await adjustStock(item.id, finalQty);
            setIsAdjusting(false);
            setAdjustmentQty("");
            Alert.alert("Success", "Stock adjusted successfully.");
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to adjust stock.");
        } finally {
            setIsSubmittingAdjustment(false);
        }
    };

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between px-5 py-3 bg-surface border-b border-border">
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ChevronRightIcon size={24} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-text truncate max-w-[60%]">{item.name}</Text>
                <TouchableOpacity onPress={handleEdit} className="p-2 bg-primary-10 rounded-md">
                    <Text className="text-primary font-semibold">Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 100 }}>

                {/* Main Info Card */}
                <View className="bg-surface rounded-lg p-4 shadow-sm border border-border">
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
                            <Text className="text-lg font-bold text-text">${item.purchasePrice.toFixed(2)}</Text>
                        </View>
                    </View>
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Stock Quantity</Text>
                            <View className="flex-row items-center gap-2">
                                <Text className={`text-2xl font-bold ${item.stockQuantity <= (item.lowStockAlert || 0) ? 'text-warning' : 'text-text'}`} style={item.stockQuantity <= (item.lowStockAlert || 0) ? { color: colors.warning } : {}}>
                                    {item.stockQuantity} {item.unit}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => setIsAdjusting(true)}
                        className="bg-primary flex-row items-center justify-center p-3 rounded-lg gap-2"
                    >
                        <RefreshCw01Icon size={18} color="#fff" />
                        <Text className="text-white font-bold">Adjust Stock</Text>
                    </TouchableOpacity>
                </View>

                {/* Performance */}
                <Text className="text-md font-bold text-text ml-1">Performance</Text>
                <View className="flex-row gap-4">
                    <View className="flex-1 bg-surface rounded-lg p-4 items-center shadow-sm border border-border">
                        <View className="mb-2 p-2 rounded-full bg-background">
                            <TrendingUpIcon size={20} color={colors.info} />
                        </View>
                        <Text className="text-xs text-text-muted">Total Sold</Text>
                        <Text className="text-xl font-bold text-text mt-1">{stats.totalSold}</Text>
                    </View>
                    <View className="flex-1 bg-surface rounded-lg p-4 items-center shadow-sm border border-border">
                        <View className="mb-2 p-2 rounded-full bg-background">
                            <DollarSignIcon size={20} color={colors.success} />
                        </View>
                        <Text className="text-xs text-text-muted">Total Revenue</Text>
                        <Text className="text-xl font-bold text-text mt-1">${stats.revenue.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Additional Info */}
                <Text className="text-md font-bold text-text ml-1">Specifications</Text>
                <View className="bg-surface rounded-lg p-4 shadow-sm border border-border">
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Brand</Text>
                            <Text className="text-md font-medium text-text">{item.brand || "—"}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Model</Text>
                            <Text className="text-md font-medium text-text">{item.modelNumber || "—"}</Text>
                        </View>
                    </View>
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Location</Text>
                            <Text className="text-md font-medium text-text">{item.location || "—"}</Text>
                        </View>
                    </View>
                    <View>
                        <Text className="text-xs text-text-muted uppercase mb-1">Description</Text>
                        <Text className="text-md text-text">{item.description || "—"}</Text>
                    </View>
                </View>

                {/* Transaction History */}
                <Text className="text-md font-bold text-text ml-1">Latest Transactions</Text>
                <View className="bg-surface rounded-lg p-4 shadow-sm border border-border">
                    {(!transactions || transactions.length === 0) ? (
                        <Text className="p-4 text-text-muted text-center">No transactions found.</Text>
                    ) : (
                        transactions.map((txn, index) => {
                            let typeColor: string = colors.text;
                            let quantitySign = '';
                            let quantityColor: string = colors.text;

                            if (txn.type === 'sale') {
                                typeColor = colors.success;
                                quantitySign = '-';
                                quantityColor = colors.danger;
                            } else if (txn.type === 'purchase') {
                                typeColor = colors.danger; // Expense/Purchase usually reddish? Or just blue?
                                quantitySign = '+';
                                quantityColor = colors.success;
                            } else if (txn.type === 'adjustment') {
                                typeColor = colors.warning;
                                quantitySign = txn.quantity > 0 ? '+' : '';
                                quantityColor = txn.quantity > 0 ? colors.success : colors.danger;
                            }

                            return (
                                <View key={`${txn.type}-${index}-${txn.date}`}>
                                    <View className="flex-row justify-between items-center mb-0 py-2">
                                        <View>
                                            <View className="flex-row items-center gap-2">
                                                <View className={`w-2 h-2 rounded-full`} style={{ backgroundColor: typeColor }} />
                                                <Text className="text-sm font-bold text-text">{txn.reference || "Unknown"}</Text>
                                            </View>
                                            <Text className="text-xs text-text-muted mt-1">{new Date(txn.date).toLocaleDateString()} • <Text style={{ color: typeColor, textTransform: 'capitalize' }}>{txn.type}</Text></Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-sm font-bold" style={{ color: quantityColor }}>
                                                {txn.type === 'sale' ? '-' : (txn.type === 'purchase' ? '+' : (txn.quantity > 0 ? '+' : ''))}{Math.abs(txn.quantity)}
                                            </Text>
                                            {txn.price > 0 && <Text className="text-xs text-text-muted">@ ${txn.price?.toFixed(2)}</Text>}
                                        </View>
                                    </View>
                                    {index < transactions.length - 1 && <View className="h-[1px] bg-border" />}
                                </View>
                            );
                        })
                    )}
                </View>

            </ScrollView>

            {/* Adjust Stock Modal */}
            <Modal
                transparent
                visible={isAdjusting}
                animationType="fade"
                onRequestClose={() => setIsAdjusting(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-center items-center bg-black/50 p-4"
                >
                    <View className="bg-surface w-full max-w-sm rounded-xl p-6 shadow-xl border border-border">
                        <Text className="text-xl font-bold text-text mb-4">Adjust Stock</Text>
                        <Text className="text-text-muted mb-4">
                            Current Stock: {item.stockQuantity} {item.unit}
                        </Text>

                        {/* Toggle Add/Remove */}
                        <View className="flex-row mb-4 bg-background-alt rounded-lg p-1 border border-border">
                            <TouchableOpacity
                                onPress={() => setAdjustmentType('add')}
                                className={`flex-1 py-2 items-center rounded-md ${adjustmentType === 'add' ? 'bg-surface shadow-sm' : ''}`}
                            >
                                <Text className={`font-semibold ${adjustmentType === 'add' ? 'text-success' : 'text-text-muted'}`}>Add (+)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setAdjustmentType('remove')}
                                className={`flex-1 py-2 items-center rounded-md ${adjustmentType === 'remove' ? 'bg-surface shadow-sm' : ''}`}
                            >
                                <Text className={`font-semibold ${adjustmentType === 'remove' ? 'text-danger' : 'text-text-muted'}`}>Remove (-)</Text>
                            </TouchableOpacity>
                        </View>

                        <Text className="text-sm font-medium text-text mb-2">Quantity</Text>
                        <TextInput
                            className="bg-background border border-border rounded-lg p-3 text-text text-lg mb-6"
                            placeholder="0.00"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                            value={adjustmentQty}
                            onChangeText={setAdjustmentQty}
                            autoFocus
                        />

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setIsAdjusting(false)}
                                className="flex-1 p-3 rounded-lg bg-background-alt border border-border items-center"
                            >
                                <Text className="font-semibold text-text">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAdjustStock}
                                disabled={isSubmittingAdjustment}
                                className="flex-1 p-3 rounded-lg bg-primary items-center"
                            >
                                {isSubmittingAdjustment ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text className="font-bold text-white">Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
