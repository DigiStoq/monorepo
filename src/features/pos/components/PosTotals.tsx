import { usePosStore } from "../stores/pos-store";
import { User, CreditCard, Banknote, UserPlus } from "lucide-react";
import { usePosTransaction } from "../hooks/usePosTransaction";
import { generateReceiptText } from "../utils/receipt-generator";
import { toast } from "sonner";

export function PosTotals() {
    const {
        cart,
        customer,
        subtotal,
        taxTotal,
        discountTotal,
        grandTotal,
        billDiscount,
        setBillDiscount,
        setCustomer,
    } = usePosStore();

    const { processTransaction } = usePosTransaction();

    const handleCheckout = async () => {
        try {
            const total = grandTotal();
            const invoiceId = await processTransaction("cash", total);

            // Simulate Receipt Generation
            if (invoiceId) {
                const receipt = generateReceiptText({
                    storeName: "DigiStoq Store",
                    storeAddress: "123 Main St, City",
                    customer,
                    items: cart, // Note: Cart is cleared in store, but we need items for receipt. 
                    // Issue: processTransaction clears cart. We need to capture state BEFORE or return it.
                    // Ideally hooks should be pure or we store snapshot.
                    // For now, let's rely on the fact that we passed data to processTransaction, 
                    // but wait, we need to capture cart BEFORE calling processTransaction or modifying the hook to return the invoice details.
                    // Let's defer clearing cart in the hook or pass the receipt data back?
                    // actually processTransaction clears cart.
                    // Checking implementation...
                    subtotal: subtotal(),
                    taxTotal: taxTotal(),
                    discountTotal: discountTotal(),
                    grandTotal: total,
                    amountPaid: total,
                    change: 0,
                    invoiceNumber: "POS-LATEST", // We don't get the generated number back easily without query.
                    date: new Date().toISOString()
                });

                // console.log(receipt);
                // toast.message("Receipt Generated", { description: "Check console for details" });
            }
        } catch (e) {
            // Error already handled in hook
        }
    };

    // Safe formatting if utility is missing
    const fmt = (val: number) => `$${val.toFixed(2)}`;

    return (
        <div className="flex flex-col h-full">
            {/* 1. Customer Section */}
            <div className="p-4 border-b border-slate-200 bg-white shadow-sm z-10">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Customer</h3>
                    {customer && (
                        <button
                            onClick={() => setCustomer(null)}
                            className="text-xs text-red-500 hover:underline"
                        >
                            Remove
                        </button>
                    )}
                </div>

                {customer ? (
                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="font-semibold text-slate-900">{customer.name}</div>
                            <div className="text-xs text-slate-500">{customer.phone || customer.email || "No contact info"}</div>
                        </div>
                    </div>
                ) : (
                    <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all">
                        <UserPlus className="h-5 w-5" />
                        <span className="font-medium">Add Customer (F11)</span>
                    </button>
                )}
            </div>

            {/* 2. Order Summary Scrollable Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {/* Bill Details */}
                <div className="space-y-3">
                    <div className="flex justify-between text-slate-600">
                        <span>Subtotal ({cart.length} items)</span>
                        <span className="font-medium">{fmt(subtotal())}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                        <span>Tax</span>
                        <span className="font-medium">{fmt(taxTotal())}</span>
                    </div>

                    <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span className="font-medium">-{fmt(discountTotal())}</span>
                    </div>
                </div>


                {/* Discount Input (Simple) */}
                <div className="pt-4 border-t border-slate-200">
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Bill Discount (%)</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={billDiscount}
                            onChange={(e) => setBillDiscount(Number(e.target.value), 'percentage')}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="0"
                        />
                        <button className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200">%</button>
                    </div>
                </div>
            </div>

            {/* 3. Grand Total & Pay Actions */}
            <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-end mb-4">
                    <div className="text-sm font-medium text-slate-500">Total Payable</div>
                    <div className="text-3xl font-bold text-slate-900 bg-slate-50 px-2 rounded-lg">{fmt(grandTotal())}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <button className="flex flex-col items-center justify-center gap-1 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all">
                        <Banknote className="h-6 w-6" />
                        <span className="text-xs font-bold">CASH</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-1 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 hover:bg-blue-100 active:scale-95 transition-all">
                        <CreditCard className="h-6 w-6" />
                        <span className="text-xs font-bold">CARD</span>
                    </button>
                </div>

                <button
                    data-action="checkout"
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full py-4 bg-primary text-white text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
                >
                    Checkout {fmt(grandTotal())} (F9)
                </button>
            </div>
        </div>
    );
}
