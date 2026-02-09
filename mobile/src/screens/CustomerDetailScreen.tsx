import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCustomerById } from "../hooks/useCustomers";
import { useTheme } from "../contexts/ThemeContext";
import { UsersIcon, FileTextIcon, TrendingUpIcon, ChevronRightIcon, PlusIcon, WalletIcon } from "../components/ui/UntitledIcons";
import { useQuery } from "@powersync/react-native";

export function CustomerDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { id } = route.params || {};
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const { customer, isLoading } = useCustomerById(id);

    // Stats Query
    const { data: statsData } = useQuery<{ lifetimeValue: number; invoiceCount: number }>(
        `SELECT 
      COALESCE(SUM(total), 0) as lifetimeValue,
      COUNT(*) as invoiceCount
     FROM invoices 
     WHERE customer_id = ? AND status != 'cancelled'`,
        [id]
    );

    const stats = statsData?.[0] || { lifetimeValue: 0, invoiceCount: 0 };

    // Recent Invoices Query
    const { data: recentInvoices, isLoading: loadingInvoices } = useQuery(
        `SELECT id, invoice_number, date, total, status 
         FROM sale_invoices 
         WHERE customer_id = ? 
         ORDER BY date DESC 
         LIMIT 5`,
        [id]
    );

    if (isLoading || !customer) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const handleEdit = () => {
        (navigation as any).navigate("CustomerForm", { id: customer.id });
    };

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between px-5 py-3 bg-surface border-b border-border">
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ChevronRightIcon size={24} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-text">{customer.name}</Text>
                <TouchableOpacity onPress={handleEdit} className="p-2 bg-primary-10 rounded-md">
                    <Text className="text-primary font-semibold">Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>

                {/* Main Info Card */}
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    <View className="flex-row items-center mb-4">
                        <UsersIcon size={32} color={colors.primary} />
                        <View className="flex-1 ml-3">
                            <Text className="text-xs text-text-muted uppercase mb-1">{customer.type.toUpperCase()}</Text>
                            <Text className="text-md font-medium text-text">{customer.email || "No Email"}</Text>
                        </View>
                        <View className={`px-3 py-1 rounded-full ${customer.isActive ? 'bg-success-20' : 'bg-danger-20'}`} style={{ backgroundColor: customer.isActive ? colors.success + '20' : colors.danger + '20' }}>
                            <Text className={`text-xs font-bold ${customer.isActive ? 'text-success' : 'text-danger'}`} style={{ color: customer.isActive ? colors.success : colors.danger }}>
                                {customer.isActive ? "Active" : "Inactive"}
                            </Text>
                        </View>
                    </View>

                    <View className="h-[1px] bg-border my-4" />

                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Current Balance</Text>
                            <Text className={`text-lg font-bold ${customer.currentBalance > 0 ? 'text-success' : 'text-text'}`} style={{ color: customer.currentBalance > 0 ? colors.success : colors.text }}>
                                ${customer.currentBalance.toFixed(2)}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Opening Balance</Text>
                            <Text className="text-md font-medium text-text">${customer.openingBalance.toFixed(2)}</Text>
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
                        <Text className="text-xs text-text-muted">Lifetime Value</Text>
                        <Text className="text-xl font-bold text-text mt-1">${stats.lifetimeValue.toFixed(2)}</Text>
                    </View>
                    <View className="flex-1 bg-surface rounded-lg p-4 items-center shadow-sm">
                        <View className="mb-2 p-2 rounded-full bg-background">
                            <FileTextIcon size={20} color={colors.success} />
                        </View>
                        <Text className="text-xs text-text-muted">Invoices</Text>
                        <Text className="text-xl font-bold text-text mt-1">{stats.invoiceCount}</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <Text className="text-md font-bold text-text ml-1">Actions</Text>
                <View className="flex-row gap-4">
                    <TouchableOpacity
                        className="flex-1 bg-primary rounded-lg p-4 flex-row items-center justify-center gap-2 shadow-sm"
                        onPress={() => (navigation as any).navigate("SaleInvoiceForm", { customerId: customer.id })}
                    >
                        <PlusIcon size={20} color="#fff" />
                        <Text className="text-white font-semibold text-sm">Create Invoice</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-1 bg-success rounded-lg p-4 flex-row items-center justify-center gap-2 shadow-sm"
                        style={{ backgroundColor: colors.success }}
                        onPress={() => (navigation as any).navigate("PaymentInForm", { customerId: customer.id })}
                    >
                        <WalletIcon size={20} color="#fff" />
                        <Text className="text-white font-semibold text-sm">Receive Payment</Text>
                    </TouchableOpacity>
                </View>

                {/* Additional Info */}
                <Text className="text-md font-bold text-text ml-1">Details</Text>
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    <View className="flex-row justify-between items-center py-1">
                        <Text className="text-xs text-text-muted uppercase">Phone</Text>
                        <Text className="text-md font-medium text-text">{customer.phone || "N/A"}</Text>
                    </View>
                    <View className="h-[1px] bg-border my-3" />
                    <View className="flex-row justify-between items-center py-1">
                        <Text className="text-xs text-text-muted uppercase">Address</Text>
                        <Text className="text-md font-medium text-text text-right flex-1 ml-4">{customer.address || "N/A"}</Text>
                    </View>
                    <View className="h-[1px] bg-border my-3" />
                    <View className="flex-row justify-between items-center py-1">
                        <Text className="text-xs text-text-muted uppercase">Credit Limit</Text>
                        <Text className="text-md font-medium text-text">{customer.creditLimit ? `$${customer.creditLimit.toFixed(2)}` : "None"}</Text>
                    </View>
                </View>

                {/* Recent Invoices */}
                <Text className="text-md font-bold text-text ml-1">Recent Invoices</Text>
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    {loadingInvoices ? (
                        <ActivityIndicator size="small" color={colors.primary} className="p-5" />
                    ) : (recentInvoices || []).length === 0 ? (
                        <Text className="text-center p-5 text-text-muted">No invoices found</Text>
                    ) : (
                        (recentInvoices || []).map((inv: any, index: number) => (
                            <View key={inv.id}>
                                <TouchableOpacity
                                    className="flex-row justify-between items-center py-2"
                                    onPress={() => (navigation as any).navigate("SaleInvoiceDetail", { id: inv.id })}
                                >
                                    <View>
                                        <Text className="text-md font-medium text-text">{inv.invoice_number}</Text>
                                        <Text className="text-xs text-text-muted mt-1">{new Date(inv.date).toLocaleDateString()}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-md font-bold text-text">${(inv.total || 0).toFixed(2)}</Text>
                                        <Text className={`text-xs font-bold mt-1 uppercase ${inv.status === 'paid' ? 'text-success' : 'text-warning'}`} style={{ color: inv.status === 'paid' ? colors.success : colors.warning }}>
                                            {inv.status}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                {index < (recentInvoices?.length || 0) - 1 && <View className="h-[1px] bg-border my-2" />}
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>
        </View>
    );
}
