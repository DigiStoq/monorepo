import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { ChevronRightIcon, EditIcon, ShareIcon } from "../../components/ui/UntitledIcons";
import { useQuery } from "@powersync/react-native";
import { usePDFGenerator } from "../../hooks/usePDFGenerator";
import { useCompanySettings } from "../../hooks/useSettings";
import { Button } from "../../components/ui";
import { usePurchaseInvoiceMutations } from "../../hooks/usePurchaseInvoices";

export function PurchaseInvoiceDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { id } = route.params || {};
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { generateInvoicePDF, generatePDF, previewPDF, isGenerating } = usePDFGenerator();
    const { settings: companySettings } = useCompanySettings();

    const { receiveInvoice, deleteInvoice } = usePurchaseInvoiceMutations();
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Fetch Invoice
    const { data: invoiceData, isLoading: loadingInvoice } = useQuery(
        `SELECT p.*, c.name as supplierName, c.email as supplierEmail, c.phone as supplierPhone, c.address as supplierAddress
         FROM purchase_invoices p
         LEFT JOIN customers c ON p.supplier_id = c.id
         WHERE p.id = ?`,
        [id]
    );
    const invoice = invoiceData?.[0];

    // Fetch Invoice Items
    const { data: items, isLoading: loadingItems } = useQuery(
        `SELECT pi.*, it.name as itemName, it.sku
         FROM purchase_invoice_items pi
         LEFT JOIN items it ON pi.item_id = it.id
         WHERE pi.purchase_invoice_id = ?`,
        [id]
    );

    const isLoading = loadingInvoice || loadingItems;

    if (isLoading) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!invoice) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <Text className="text-text-muted">Invoice not found.</Text>
            </View>
        );
    }

    const handlePDFAction = async () => {
        const fullInvoice = {
            documentTitle: "PURCHASE INVOICE",
            documentNumber: invoice.invoice_number,
            date: invoice.issue_date || invoice.date,
            dueDate: invoice.due_date,

            companyName: companySettings?.name || "My Company",
            companyAddress: companySettings?.address ? `${companySettings.address.street}, ${companySettings.address.city}, ${companySettings.address.state}` : "",
            companyPhone: companySettings?.contact?.phone,
            companyEmail: companySettings?.contact?.email,

            customerName: invoice.supplierName,
            customerEmail: invoice.supplierEmail,
            customerPhone: invoice.supplierPhone,
            customerAddress: invoice.supplierAddress,

            items: (items || []).map((item: any) => ({
                description: item.itemName || "Item",
                quantity: item.quantity,
                rate: item.unit_price || item.rate,
                amount: item.amount || (item.quantity * (item.unit_price || 0))
            })),

            subtotal: invoice.subtotal || 0,
            taxTotal: invoice.tax_amount || 0,
            total: invoice.total_amount || 0,
            currencySymbol: "$"
        };

        Alert.alert(
            "Invoice PDF",
            "Choose an action",
            [
                {
                    text: "Preview",
                    onPress: async () => {
                        const html = (await import("../../lib/pdf/htmlTemplates")).generateInvoiceHTML(fullInvoice);
                        const filename = `Purchase_Invoice_${invoice.invoice_number}.pdf`;
                        const uri = await generatePDF(html, filename);
                        await previewPDF(uri);
                    }
                },
                {
                    text: "Share",
                    onPress: async () => {
                        await generateInvoicePDF(fullInvoice);
                    }
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const handleEdit = () => {
        (navigation as any).navigate("PurchaseInvoiceForm", { id: invoice.id });
    };

    const handleReceive = () => {
        Alert.alert(
            "Receive Stock",
            "This will update inventory quantities and supplier balance. Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        setIsActionLoading(true);
                        try {
                            await receiveInvoice(id);
                            Alert.alert("Success", "Stock received and status updated.");
                            // Query will auto-update status in UI
                        } catch (error: any) {
                            console.error(error);
                            Alert.alert("Error", error.message || "Failed to receive stock");
                        } finally {
                            setIsActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Invoice",
            "Are you sure you want to delete this invoice? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setIsActionLoading(true);
                        try {
                            await deleteInvoice(id);
                            Alert.alert("Success", "Invoice deleted successfully");
                            navigation.goBack();
                        } catch (error: any) {
                            console.error(error);
                            Alert.alert("Error", error.message || "Failed to delete invoice");
                        } finally {
                            setIsActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const statusColors: Record<string, { bg: string; text: string }> = {
        draft: { bg: colors.surfaceHover, text: colors.textMuted },
        sent: { bg: colors.info + '20', text: colors.info },
        paid: { bg: colors.success + '20', text: colors.success },
        received: { bg: colors.success + '20', text: colors.success },
        partial: { bg: colors.warning + '20', text: colors.warning },
        overdue: { bg: colors.danger + '20', text: colors.danger },
        pending: { bg: colors.warning + '20', text: colors.warning },
        cancelled: { bg: colors.surfaceHover, text: colors.textMuted },
    };
    const statusStyle = statusColors[invoice.status?.toLowerCase()] || statusColors.draft;

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between px-4 py-3 bg-surface border-b border-border">
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ChevronRightIcon size={24} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-text">Invoice #{invoice.invoice_number}</Text>
                <View className="flex-row gap-2">
                    <TouchableOpacity onPress={handlePDFAction} className="p-2 bg-primary-10 rounded-md" disabled={isGenerating}>
                        {isGenerating ? <ActivityIndicator size="small" color={colors.primary} /> : <ShareIcon size={20} color={colors.primary} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleEdit} className="p-2 bg-primary-10 rounded-md">
                        <EditIcon size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 100 }}>
                {/* Status & Supplier Card */}
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    <View
                        className="px-3 py-1 rounded-sm mb-3 self-start"
                        style={{ backgroundColor: statusStyle.bg }}
                    >
                        <Text
                            className="text-xs font-bold uppercase"
                            style={{ color: statusStyle.text }}
                        >
                            {invoice.status?.toUpperCase() || "DRAFT"}
                        </Text>
                    </View>
                    <Text className="text-lg font-bold text-text mb-1">{invoice.supplierName || "Unknown Supplier"}</Text>
                    <Text className="text-sm text-text-muted">{new Date(invoice.issue_date).toLocaleDateString()}</Text>
                </View>

                {/* Items List */}
                <Text className="text-md font-bold text-text ml-1">Items</Text>
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    {(items || []).map((item: any, index: number) => (
                        <View key={item.id}>
                            <View className="flex-row justify-between items-start py-2">
                                <View className="flex-1">
                                    <Text className="text-md font-medium text-text">{item.itemName || "Item"}</Text>
                                    <Text className="text-sm text-text-muted mt-1">{item.quantity} x ${item.unit_price?.toFixed(2)}</Text>
                                </View>
                                <Text className="text-md font-bold text-text">${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}</Text>
                            </View>
                            {index < (items?.length || 0) - 1 && <View className="h-[1px] bg-border my-2" />}
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-lg font-bold text-text">Total</Text>
                        <Text className="text-xl font-bold text-primary">${(invoice.total_amount || 0).toFixed(2)}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-col gap-3 mt-4">
                    {invoice.status === 'draft' && (
                        <Button
                            onPress={handleReceive}
                            isLoading={isActionLoading}
                            className="bg-primary"
                        >
                            Receive Stock
                        </Button>
                    )}

                    <Button
                        onPress={handleDelete}
                        isLoading={isActionLoading}
                        variant="danger"
                        // Note: variant 'destructive' was flagged by lint as invalid? 
                        // Checked ui/Button.tsx? Usually 'danger' or 'destructive'. 
                        // Lint said: '"primary" | "secondary" | "outline" | "ghost" | "danger"'.
                        // So 'danger' is correct.
                        className="bg-red-500"
                    >
                        Delete Invoice
                    </Button>
                </View>

            </ScrollView>
        </View>
    );
}
