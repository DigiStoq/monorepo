import { generateReceiptText } from "../utils/receipt-generator";
import { useSaleInvoices } from "@/hooks/useSaleInvoices";
import { format } from "date-fns";
import { RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PosRecentTransactionsProps {
    onClose: () => void;
}

export function PosRecentTransactions({ onClose }: PosRecentTransactionsProps) {
    const { invoices, isLoading } = useSaleInvoices({
        status: "paid", // Only show paid sales for now
    });

    // Limit to recent 10 and sort by date desc (hook might already sort)
    const recentInvoices = invoices
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

    return (
        <div className="h-full flex flex-col bg-white border-l border-slate-200 shadow-xl w-[350px]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Recent Transactions
                </h3>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    Close
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : recentInvoices.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No recent transactions found.</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {recentInvoices.map((inv) => (
                            <div key={inv.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <div className="font-medium text-slate-900">{inv.invoiceNumber}</div>
                                        <div className="text-xs text-slate-500">{inv.customerName}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-900">${inv.total.toFixed(2)}</div>
                                        <div className="text-[10px] text-slate-400">{format(new Date(inv.date), "h:mm a")}</div>
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-end">
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                                        const receipt = generateReceiptText({
                                            storeName: "DigiStoq Store",
                                            storeAddress: "123 Main St",
                                            customer: { name: inv.customerName, id: inv.customerId } as any,
                                            items: inv.items.map((i) => ({
                                                id: i.itemId,
                                                name: i.itemName,
                                                quantity: i.quantity,
                                                price: i.unitPrice,
                                                discount: i.discountPercent || 0,
                                                discountType: 'percentage',
                                                stockQuantity: 999
                                            })),
                                            subtotal: inv.subtotal,
                                            taxTotal: inv.taxAmount,
                                            discountTotal: inv.discountAmount,
                                            grandTotal: inv.total,
                                            amountPaid: inv.amountPaid,
                                            change: 0,
                                            invoiceNumber: inv.invoiceNumber,
                                            date: inv.date
                                        });
                                        console.log(receipt);
                                        // In real app, send to printer driver
                                        alert("Printing Receipt:\n\n" + receipt);
                                    }}>
                                        <FileText className="h-3 w-3 mr-1" />
                                        Print Receipt
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
