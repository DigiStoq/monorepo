import React, { useState, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeftIcon, SearchIcon, ShareIcon, CalendarIcon } from "../../components/ui/UntitledIcons";
import type { DateRange } from "../../hooks/useReports";
import { useCustomerStatementReport } from "../../hooks/useReports";
import { useQuery } from "@powersync/react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface CustomerSelection {
    id: string;
    name: string;
}

export function CustomerStatementScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerSelection | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);

    // Fetch statement if customer selected
    const { statement, isLoading } = useCustomerStatementReport(
        selectedCustomer?.id || "",
        dateRange
    );

    // Fetch customers list for modal
    const { data: allCustomers } = useQuery<{ id: string; name: string }>(
        `SELECT id, name FROM customers ORDER BY name`
    );

    const formatCurrency = (amount: number) => "$" + (amount || 0).toFixed(2);
    const formatDate = (date: string) => new Date(date).toLocaleDateString();

    const renderCustomerModal = () => (
        <Modal visible={showCustomerModal} animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-surface rounded-t-xl h-[70%] p-4">
                    <View className="flex-row justify-between items-center mb-4 border-b border-border pb-2">
                        <Text className="text-lg font-semibold text-text">Select Customer</Text>
                        <TouchableOpacity onPress={() => { setShowCustomerModal(false); }}>
                            <Text className="text-primary text-base">Close</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={allCustomers || []}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                className="py-3 border-b border-border"
                                onPress={() => {
                                    setSelectedCustomer(item);
                                    setShowCustomerModal(false);
                                }}
                            >
                                <Text className="text-base text-text">{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between p-4 bg-surface border-b border-border mt-6 android:mt-6">
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ArrowLeftIcon color={colors.text} size={24} />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-text">Customer Statement</Text>
                <TouchableOpacity className="p-2">
                    <ShareIcon color={colors.textSecondary} size={20} />
                </TouchableOpacity>
            </View>

            {/* Inputs */}
            <View className="p-4 bg-surface border-b border-border">
                <TouchableOpacity
                    className="flex-row items-center bg-surface-hover p-3 rounded-lg mb-3 border border-border"
                    onPress={() => { setShowCustomerModal(true); }}
                >
                    <SearchIcon size={18} color={colors.textSecondary} />
                    <Text className={`ml-2 text-base ${selectedCustomer ? 'text-text' : 'text-text-muted'}`}>
                        {selectedCustomer ? selectedCustomer.name : "Select Customer..."}
                    </Text>
                </TouchableOpacity>
                <View className="flex-row items-center gap-2 justify-end">
                    <CalendarIcon size={16} color={colors.textSecondary} />
                    <Text className="text-sm text-text-secondary">{dateRange.from} - {dateRange.to}</Text>
                </View>
            </View>

            {/* Statement Content */}
            {!selectedCustomer ? (
                <View className="flex-1 justify-center items-center p-8">
                    <View className="w-20 h-20 bg-surface-hover rounded-full items-center justify-center mb-4">
                        <SearchIcon size={40} color={colors.border} />
                    </View>
                    <Text className="text-text-secondary text-base text-center">Select a customer to view their statement</Text>
                </View>
            ) : isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-text-muted">Loading statement...</Text>
                </View>
            ) : !statement ? (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-text-secondary text-base">No data found</Text>
                </View>
            ) : (
                <View className="flex-1">
                    {/* Summary Header */}
                    <View className="m-4 bg-surface p-4 rounded-xl border border-border">
                        <View className="flex-row gap-4 mb-3">
                            <View className="flex-1">
                                <Text className="text-xs text-text-secondary mb-1">Opening</Text>
                                <Text className="text-base font-semibold text-text">{formatCurrency(statement.openingBalance)}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-text-secondary mb-1">Debited</Text>
                                <Text className="text-base font-semibold text-text">{formatCurrency(statement.totalDebit)}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-text-secondary mb-1">Credited</Text>
                                <Text className="text-base font-semibold text-text">{formatCurrency(statement.totalCredit)}</Text>
                            </View>
                        </View>
                        <View className="h-[1px] bg-border my-2" />
                        <View className="flex-row justify-between items-center mt-1">
                            <Text className="text-base font-semibold text-text">Closing Balance</Text>
                            <Text className={`text-lg font-bold ${statement.closingBalance > 0 ? 'text-danger' : 'text-success'}`}>
                                {formatCurrency(Math.abs(statement.closingBalance))} {statement.closingBalance > 0 ? 'Dr' : 'Cr'}
                            </Text>
                        </View>
                    </View>

                    {/* Ledger Table Header */}
                    <View className="flex-row px-4 py-3 bg-surface-hover border-y border-border">
                        <Text className="text-xs font-semibold text-text-secondary w-20">Date</Text>
                        <Text className="text-xs font-semibold text-text-secondary flex-1">Desc</Text>
                        <Text className="text-xs font-semibold text-text-secondary w-[70px] text-right">Debit</Text>
                        <Text className="text-xs font-semibold text-text-secondary w-[70px] text-right">Credit</Text>
                    </View>

                    <FlatList
                        data={statement.entries}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        renderItem={({ item }) => (
                            <View className={`flex-row p-3 border-b border-border bg-surface ${item.type === 'opening' ? 'bg-surface-hover' : ''}`}>
                                <View className="w-20">
                                    <Text className="text-xs text-text-secondary">{formatDate(item.date)}</Text>
                                    <Text className="text-[10px] text-text-muted mt-0.5">{item.referenceNumber}</Text>
                                </View>
                                <View className="flex-1 pr-1">
                                    <Text className="text-xs text-text-secondary font-medium">{item.description}</Text>
                                    <Text className="text-[10px] text-text-muted mt-1">Bal: {formatCurrency(item.balance)}</Text>
                                </View>
                                <Text className={`text-xs w-[70px] text-right ${item.debit ? 'text-text' : 'text-text-muted'}`}>
                                    {item.debit ? formatCurrency(item.debit) : '-'}
                                </Text>
                                <Text className={`text-xs w-[70px] text-right ${item.credit ? 'text-success' : 'text-text-muted'}`}>
                                    {item.credit ? formatCurrency(item.credit) : '-'}
                                </Text>
                            </View>
                        )}
                    />
                </View>
            )}

            {renderCustomerModal()}
        </View>
    );
}
