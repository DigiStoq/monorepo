import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";
import {
    ReceiptIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    ShareIcon,
    EditIcon,
    TrashIcon,
    FileTextIcon,
    PrinterIcon,
    SendIcon,
    XCircleIcon,
    RefreshCw01Icon
} from "../../components/ui/UntitledIcons";
import { useEstimateById, useEstimateMutations, EstimateStatus } from "../../hooks/useEstimates";
import { usePDFGenerator } from "../../hooks/usePDFGenerator";
import { useCompanySettings } from "../../hooks/useSettings";

export function EstimateDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { id } = route.params || {};
    const { colors } = useTheme();
    const { generateEstimatePDF, isGenerating } = usePDFGenerator();
    const { settings: companySettings } = useCompanySettings();
    const { deleteEstimate, updateEstimateStatus, convertEstimateToInvoice } = useEstimateMutations();

    const { estimate, items, isLoading, error } = useEstimateById(id);

    const [isConverting, setIsConverting] = useState(false);

    if (isLoading) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!estimate || error) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <Text className="text-text-muted">Estimate not found.</Text>
            </View>
        );
    }

    const handleEdit = () => {
        if (estimate.status === 'converted') {
            Alert.alert("Converted", "You cannot edit a converted estimate.");
            return;
        }
        (navigation as any).navigate("EstimateForm", { id: estimate.id });
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Estimate",
            "Are you sure you want to delete this estimate? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteEstimate(estimate.id);
                            navigation.goBack();
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Error", "Failed to delete estimate.");
                        }
                    }
                }
            ]
        );
    };

    const handleGeneratePDF = async () => {
        // Prepare PDF Data
        const address = companySettings?.address;
        const formattedAddress = address
            ? `${address.street}, ${address.city}, ${address.state} ${address.postalCode}`
            : "";

        const pdfData: any = {
            documentTitle: "ESTIMATE",
            documentNumber: estimate.estimateNumber,
            date: estimate.date,
            dueDate: estimate.validUntil,
            companyName: companySettings?.name || "DigiStoq",
            companyAddress: formattedAddress,
            companyEmail: companySettings?.contact?.email || "",
            companyPhone: companySettings?.contact?.phone || "",
            customerName: estimate.customerName,
            // Fetch customer details if needed
            items: items.map(item => ({
                description: item.itemName,
                quantity: item.quantity,
                rate: item.unitPrice,
                amount: item.amount
            })),
            subtotal: estimate.subtotal,
            taxTotal: estimate.taxAmount,
            discountTotal: estimate.discountAmount,
            total: estimate.total,
            currencySymbol: companySettings?.currency || "$", // Using currency code
            notes: estimate.notes,
            terms: estimate.terms
        };

        await generateEstimatePDF(pdfData);
    };

    const handleStatusUpdate = (status: EstimateStatus) => {
        Alert.alert(
            "Update Status",
            `Mark estimate as ${status}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        try {
                            await updateEstimateStatus(estimate.id, status);
                        } catch (e) {
                            console.error(e);
                            Alert.alert("Error", "Failed to update status");
                        }
                    }
                }
            ]
        );
    };

    const handleConvert = () => {
        Alert.alert(
            "Convert to Invoice",
            "This will create a new Invoice from this Estimate and update stock quantities. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Convert",
                    onPress: async () => {
                        setIsConverting(true);
                        try {
                            const newInvoiceId = await convertEstimateToInvoice(estimate, items);
                            Alert.alert("Success", "Estimate converted to Invoice", [
                                {
                                    text: "View Invoice",
                                    onPress: () => {
                                        (navigation as any).navigate("SaleInvoiceDetail", { id: newInvoiceId });
                                    }
                                },
                                { text: "OK" }
                            ]);
                        } catch (e) {
                            console.error(e);
                            Alert.alert("Error", "Failed to convert estimate");
                        } finally {
                            setIsConverting(false);
                        }
                    }
                }
            ]
        );
    };


    const statusColors: Record<string, { bg: string; text: string }> = {
        draft: { bg: colors.surfaceHover, text: colors.textMuted },
        sent: { bg: colors.info + '20', text: colors.info },
        accepted: { bg: colors.success + '20', text: colors.success },
        declined: { bg: colors.danger + '20', text: colors.danger },
        converted: { bg: colors.primary + '20', text: colors.primary },
        expired: { bg: colors.warning + '20', text: colors.warning },
    };
    const currentStatusStyle = statusColors[estimate.status] || statusColors.draft;

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between px-4 py-3 bg-surface border-b border-border">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
                    <ChevronRightIcon size={24} color={colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-text">Estimate Details</Text>
                <View className="flex-row gap-2">
                    <TouchableOpacity onPress={handleEdit} className="p-2">
                        <EditIcon size={20} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} className="p-2">
                        <TrashIcon size={20} color={colors.danger} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {/* Header Card */}
                <View className="bg-surface p-5 rounded-xl shadow-sm mb-4 border border-border">
                    <View className="flex-row justify-between items-start mb-4">
                        <View>
                            <Text className="text-sm text-text-muted mb-1">Estimate No.</Text>
                            <Text className="text-xl font-bold text-text">{estimate.estimateNumber}</Text>
                        </View>
                        <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: currentStatusStyle.bg }}>
                            <Text className="text-xs font-bold uppercase" style={{ color: currentStatusStyle.text }}>
                                {estimate.status}
                            </Text>
                        </View>
                    </View>

                    <View className="h-[1px] bg-border my-4" />

                    <View className="flex-row justify-between mb-4">
                        <View>
                            <Text className="text-xs text-text-muted mb-1">Date</Text>
                            <Text className="text-sm font-medium text-text">{new Date(estimate.date).toLocaleDateString()}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-xs text-text-muted mb-1">Valid Until</Text>
                            <Text className="text-sm font-medium text-text">{new Date(estimate.validUntil).toLocaleDateString()}</Text>
                        </View>
                    </View>

                    <View>
                        <Text className="text-xs text-text-muted mb-1">Customer</Text>
                        <Text className="text-md font-bold text-text">{estimate.customerName}</Text>
                    </View>
                </View>

                {/* Items */}
                <View className="bg-surface rounded-xl shadow-sm mb-4 border border-border overflow-hidden">
                    <View className="p-4 bg-background-alt border-b border-border">
                        <Text className="font-bold text-text">Items</Text>
                    </View>
                    {items.map((item, index) => (
                        <View key={item.id} className={`p-4 ${index !== items.length - 1 ? 'border-b border-border-light' : ''}`}>
                            <View className="flex-row justify-between mb-1">
                                <Text className="font-medium text-text flex-1 mr-2">{item.itemName}</Text>
                                <Text className="font-bold text-text">
                                    {companySettings?.currency} {item.amount.toFixed(2)}
                                </Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-xs text-text-muted">
                                    {item.quantity} {item.unit} x {companySettings?.currency} {item.unitPrice.toFixed(2)}
                                </Text>
                                {item.taxPercent > 0 && (
                                    <Text className="text-xs text-text-muted">Tax: {item.taxPercent}%</Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View className="bg-surface p-4 rounded-xl shadow-sm mb-6 border border-border">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-text-muted">Subtotal</Text>
                        <Text className="text-text font-medium">{companySettings?.currency} {estimate.subtotal.toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-text-muted">Tax</Text>
                        <Text className="text-text font-medium">{companySettings?.currency} {estimate.taxAmount.toFixed(2)}</Text>
                    </View>
                    {estimate.discountAmount > 0 && (
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-success">Discount</Text>
                            <Text className="text-success font-medium">-{companySettings?.currency} {estimate.discountAmount.toFixed(2)}</Text>
                        </View>
                    )}
                    <View className="h-[1px] bg-border my-2" />
                    <View className="flex-row justify-between">
                        <Text className="text-lg font-bold text-text">Total</Text>
                        <Text className="text-lg font-bold text-primary">{companySettings?.currency} {estimate.total.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Terms / Notes */}
                {(estimate.notes || estimate.terms) && (
                    <View className="bg-surface p-4 rounded-xl shadow-sm mb-6 border border-border">
                        {estimate.notes && (
                            <View className="mb-4">
                                <Text className="text-xs text-text-muted uppercase mb-1">Notes</Text>
                                <Text className="text-sm text-text">{estimate.notes}</Text>
                            </View>
                        )}
                        {estimate.terms && (
                            <View>
                                <Text className="text-xs text-text-muted uppercase mb-1">Terms</Text>
                                <Text className="text-sm text-text">{estimate.terms}</Text>
                            </View>
                        )}
                    </View>
                )}

            </ScrollView>

            {/* Bottom Actions */}
            <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border p-4 px-6 pb-6">
                <View className="flex-row gap-3 overflow-x-auto">
                    {/* Primary: Convert */}
                    {estimate.status !== 'converted' && (
                        <TouchableOpacity
                            onPress={handleConvert}
                            disabled={isConverting}
                            className={`flex-1 flex-row items-center justify-center p-3 rounded-lg bg-primary gap-2 ${isConverting ? 'opacity-50' : ''}`}
                        >
                            {isConverting ? <ActivityIndicator color="#fff" size="small" /> : <RefreshCw01Icon size={20} color="#fff" />}
                            <Text className="text-white font-bold">Convert to Invoice</Text>
                        </TouchableOpacity>
                    )}

                    {/* Secondary: PDF */}
                    <TouchableOpacity
                        onPress={handleGeneratePDF}
                        disabled={isGenerating}
                        className="w-12 h-12 items-center justify-center rounded-lg bg-surface border border-border"
                    >
                        {isGenerating ? <ActivityIndicator size="small" color={colors.text} /> : <PrinterIcon size={20} color={colors.text} />}
                    </TouchableOpacity>

                    {/* Status Actions */}
                    {estimate.status === 'draft' && (
                        <TouchableOpacity
                            onPress={() => handleStatusUpdate('sent')}
                            className="bg-info items-center justify-center px-4 rounded-lg"
                        >
                            <Text className="text-white font-bold">Mark Sent</Text>
                        </TouchableOpacity>
                    )}
                    {estimate.status === 'sent' && (
                        <TouchableOpacity
                            onPress={() => handleStatusUpdate('accepted')}
                            className="bg-success items-center justify-center px-4 rounded-lg"
                        >
                            <Text className="text-white font-bold">Accept</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}
