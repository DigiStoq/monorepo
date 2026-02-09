import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { FileTextIcon, ChevronRightIcon, ShareIcon, EditIcon, WalletIcon } from "../../components/ui/UntitledIcons";
import { useQuery } from "@powersync/react-native";
import { usePDFGenerator } from "../../hooks/usePDFGenerator";
import { useCompanySettings } from "../../hooks/useSettings";

export function SaleInvoiceDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { id } = route.params || {};
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { generateInvoicePDF, generatePDF, previewPDF, isGenerating } = usePDFGenerator();
    const { settings: companySettings } = useCompanySettings();

    // Fetch Invoice
    const { data: invoiceData, isLoading: loadingInvoice } = useQuery(
        `SELECT i.*, c.name as customerName, c.email as customerEmail, c.phone as customerPhone, c.address as customerAddress
         FROM sale_invoices i
         LEFT JOIN customers c ON i.customer_id = c.id
         WHERE i.id = ?`,
        [id]
    );
    const invoice = invoiceData?.[0];

    // Fetch Invoice Items
    const { data: items, isLoading: loadingItems } = useQuery(
        `SELECT ii.*, it.name as itemName, it.sku
         FROM sale_invoice_items ii
         LEFT JOIN items it ON ii.item_id = it.id
         WHERE ii.invoice_id = ?`,
        [id]
    );

    // Fetch Payments
    const { data: payments, isLoading: loadingPayments } = useQuery(
        `SELECT * FROM payment_ins WHERE invoice_id = ? ORDER BY date DESC`,
        [id]
    );

    // Fetch Activity History
    const { data: history, isLoading: loadingHistory } = useQuery(
        `SELECT * FROM invoice_history WHERE invoice_id = ? ORDER BY created_at DESC`,
        [id]
    );

    const isLoading = loadingInvoice || loadingItems || loadingPayments || loadingHistory;

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

    const handleEdit = () => {
        if (invoice.status === 'paid') {
            Alert.alert("Invoice Paid", "You cannot edit a paid invoice.");
            return;
        }
        (navigation as any).navigate("SaleInvoiceForm", { id: invoice.id });
    };

    const handleRecordPayment = () => {
        if (invoice.status === 'paid') {
            Alert.alert("Fully Paid", "This invoice is already fully paid.");
            return;
        }
        (navigation as any).navigate("PaymentInForm", { invoiceId: invoice.id, customerId: invoice.customer_id });
    };

    const handlePDFAction = async () => {
        const fullInvoice = {
            documentTitle: "INVOICE",
            documentNumber: invoice.invoiceNumber,
            date: invoice.issueDate || invoice.date, // Handle snake_case or whatever DB returns
            dueDate: invoice.dueDate,

            // Company Info
            companyName: companySettings?.name || "My Company",
            companyAddress: companySettings?.address ? `${companySettings.address.street}, ${companySettings.address.city}, ${companySettings.address.state}` : "",
            companyPhone: companySettings?.contact?.phone,
            companyEmail: companySettings?.contact?.email,

            // Customer Info
            customerName: invoice.customerName,
            customerEmail: invoice.customerEmail,
            customerPhone: invoice.customerPhone,
            customerAddress: invoice.customerAddress,

            // Items
            items: (items || []).map((item: any) => ({
                description: item.itemName || "Item",
                quantity: item.quantity,
                rate: item.unitPrice || item.rate,
                amount: item.amount || (item.quantity * (item.unitPrice || 0))
            })),

            // Totals
            subtotal: invoice.subtotal || 0,
            taxTotal: invoice.taxAmount || 0,
            total: invoice.totalAmount || 0,
            amountPaid: 0, // TODO: Calculate from payments
            balanceDue: invoice.totalAmount || 0, // TODO: Update if payments exist
            currencySymbol: "$" // TODO: From settings
        };

        Alert.alert(
            "Invoice PDF",
            "Choose an action",
            [
                {
                    text: "Preview",
                    onPress: async () => {
                        const html = (await import("../../lib/pdf/htmlTemplates")).generateInvoiceHTML(fullInvoice);
                        const filename = `Invoice_${invoice.invoiceNumber}.pdf`;
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

    const statusColors: Record<string, { bg: string; text: string }> = {
        draft: { bg: colors.surfaceHover, text: colors.textMuted },
        sent: { bg: colors.infoMuted, text: colors.info },
        paid: { bg: colors.successMuted, text: colors.success },
        partial: { bg: colors.warningMuted, text: colors.warning },
        overdue: { bg: colors.dangerMuted, text: colors.danger },
        pending: { bg: colors.warningMuted, text: colors.warning },
        cancelled: { bg: colors.surfaceHover, text: colors.textMuted },
    };
    const statusStyle = statusColors[invoice.status] || statusColors.draft;

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between px-5 py-3 bg-surface border-b border-border">
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ChevronRightIcon size={24} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-text">Invoice #{invoice.invoiceNumber}</Text>
                <View className="flex-row gap-2">
                    <TouchableOpacity onPress={handleRecordPayment} className="p-2 rounded-md" style={{ backgroundColor: colors.success + '20' }}>
                        <WalletIcon size={20} color={colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handlePDFAction} className="p-2 bg-primary-10 rounded-md" disabled={isGenerating}>
                        {isGenerating ? <ActivityIndicator size="small" color={colors.primary} /> : <ShareIcon size={20} color={colors.primary} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleEdit} className="p-2 bg-primary-10 rounded-md">
                        <EditIcon size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
                {/* Status & Customer Card */}
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    <View className="flex-row justify-between items-center mb-2">
                        <View className="px-3 py-1 rounded-sm" style={{ backgroundColor: statusStyle.bg }}>
                            <Text className="text-xs font-bold" style={{ color: statusStyle.text }}>{invoice.status.toUpperCase()}</Text>
                        </View>
                        <Text className="text-sm text-text-muted">Inv Date: {new Date(invoice.date).toLocaleDateString()}</Text>
                    </View>

                    <Text className="text-lg font-bold text-text mb-1">{invoice.customerName || "Unknown Customer"}</Text>

                    <View className="flex-row gap-4 my-3">
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Due Date</Text>
                            <Text className="text-md text-text font-medium">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-text-muted uppercase mb-1">Balance Due</Text>
                            <Text className="text-md font-medium" style={{ color: invoice.amount_due > 0 ? colors.danger : colors.success }}>
                                ${(invoice.amount_due || 0).toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    {invoice.terms ? (
                        <View className="mt-3">
                            <Text className="text-xs text-text-muted uppercase mb-1">Terms</Text>
                            <Text className="text-md text-text font-medium">{invoice.terms}</Text>
                        </View>
                    ) : null}
                    {invoice.notes ? (
                        <View className="mt-3">
                            <Text className="text-xs text-text-muted uppercase mb-1">Notes</Text>
                            <Text className="text-md text-text font-medium">{invoice.notes}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Items List */}
                <Text className="text-md font-bold text-text ml-1">Items</Text>
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    {(items || []).map((item: any, index: number) => (
                        <View key={item.id}>
                            <View className="flex-row justify-between items-start">
                                <View className="flex-1">
                                    <View className="flex-row justify-between">
                                        <Text className="text-md text-text font-medium">{item.itemName || "Item"}</Text>
                                    </View>
                                    {item.batch_number ? <Text className="text-sm text-text-muted mt-0.5">Batch: {item.batch_number}</Text> : null}
                                    <View className="flex-row gap-3 mt-1">
                                        <Text className="text-sm text-text-muted">Qty: {item.quantity}</Text>
                                        <Text className="text-sm text-text-muted">Rate: ${item.unit_price?.toFixed(2)}</Text>
                                    </View>
                                    <View className="flex-row gap-3">
                                        {item.mrp ? <Text className="text-sm text-text-muted">MRP: ${item.mrp}</Text> : null}
                                        {item.discount_percent ? <Text className="text-sm text-text-muted">Disc: {item.discount_percent}%</Text> : null}
                                        {item.tax_percent ? <Text className="text-sm text-text-muted">Tax: {item.tax_percent}%</Text> : null}
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-md font-bold text-text">${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}</Text>
                                    {item.amount && item.amount !== ((item.quantity || 0) * (item.unit_price || 0)) && (
                                        <Text className="text-xs text-text-muted mt-0.5">Net: ${item.amount.toFixed(2)}</Text>
                                    )}
                                </View>
                            </View>
                            {index < (items?.length || 0) - 1 && <View className="h-[1px] bg-border my-3" />}
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-md text-text-muted">Subtotal</Text>
                        <Text className="text-md text-text font-medium">${(invoice.subtotal || 0).toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-md text-text-muted">Discount</Text>
                        <Text className="text-md text-text font-medium">-${(invoice.discount_amount || 0).toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-md text-text-muted">Tax</Text>
                        <Text className="text-md text-text font-medium">+${(invoice.tax_amount || 0).toFixed(2)}</Text>
                    </View>
                    <View className="h-[1px] bg-border my-2" />
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-lg font-bold text-text">Total</Text>
                        <Text className="text-xl font-bold text-primary">${(invoice.total || 0).toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-md text-green-600">Paid</Text>
                        <Text className="text-md text-green-600 font-medium">-${(invoice.amount_paid || 0).toFixed(2)}</Text>
                    </View>
                    <View className="h-[1px] bg-border my-2" />
                    <View className="flex-row justify-between items-center">
                        <Text className="text-lg font-bold text-text">Balance Due</Text>
                        <Text className="text-xl font-bold text-red-600">${(invoice.amount_due || 0).toFixed(2)}</Text>
                    </View>
                </View>

                {/* Payment History */}
                <Text className="text-md font-bold text-text ml-1">Payment History</Text>
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    {(!payments || payments.length === 0) ? (
                        <Text className="p-4 text-text-muted text-center">No payments recorded.</Text>
                    ) : (
                        payments.map((pay: any, index: number) => (
                            <View key={pay.id}>
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-md text-text font-medium">{new Date(pay.date).toLocaleDateString()}</Text>
                                        <Text className="text-sm text-text-muted mt-0.5">{pay.payment_mode?.toUpperCase()}</Text>
                                    </View>
                                    <Text className="text-md font-bold text-green-600">+${pay.amount.toFixed(2)}</Text>
                                </View>
                                {index < payments.length - 1 && <View className="h-[1px] bg-border my-3" />}
                            </View>
                        ))
                    )}
                </View>

                {/* Activity History */}
                <Text className="text-md font-bold text-text ml-1">Activity</Text>
                <View className="bg-surface rounded-lg p-4 shadow-sm">
                    {(!history || history.length === 0) ? (
                        <Text className="p-4 text-text-muted text-center">No activity recorded.</Text>
                    ) : (
                        history.map((h: any, index: number) => (
                            <View key={h.id} className="mb-4">
                                <View className="flex-row justify-between items-center mb-1">
                                    <Text className="text-xs text-text-muted uppercase font-bold">{new Date(h.created_at).toLocaleString()}</Text>
                                    <Text className="text-xs text-text-muted font-bold">{h.action?.toUpperCase()}</Text>
                                </View>
                                <Text className="text-md text-text font-medium">{h.description}</Text>
                                <Text className="text-sm text-text-muted mt-1">by {h.user_name || 'System'}</Text>
                                {index < history.length - 1 && <View className="h-[1px] bg-border my-2" />}
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>
        </View>
    );
}
