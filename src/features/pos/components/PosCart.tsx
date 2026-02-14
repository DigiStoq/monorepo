import { Trash2, Plus, Minus } from "lucide-react";
import { usePosStore } from "../stores/pos-store";
import { cn } from "@/lib/cn";

export function PosCart() {
    const { cart, removeItem, updateQuantity, selectedItemId, setSelectedItem } = usePosStore();

    if (cart.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="h-32 w-32 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <div className="text-6xl">🛒</div>
                </div>
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Cart is Empty</h3>
                <p className="max-w-xs text-sm">Scan a barcode or search for items above to start billing.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase w-[40%]">Item</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase w-[20%] text-center">Price</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase w-[25%] text-center">Qty</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase w-[15%] text-right">Total</th>
                        <th className="w-[10%]"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {cart.map((item) => (
                        <tr
                            key={item.id}
                            onClick={() => setSelectedItem(item.id)}
                            className={cn(
                                "cursor-pointer transition-colors hover:bg-slate-50/80",
                                selectedItemId === item.id ? "bg-blue-50/60 ring-1 ring-inset ring-blue-200" : ""
                            )}
                        >
                            <td className="py-3 px-4 align-top">
                                <div className="font-medium text-slate-900">{item.name}</div>
                                <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</div>
                                {item.discount > 0 && (
                                    <div className="text-xs text-green-600 mt-1">
                                        Discount: {item.discountType === 'percentage' ? `${item.discount}%` : `$${item.discount}`}
                                    </div>
                                )}
                            </td>
                            <td className="py-3 px-4 text-center align-top">
                                <div className="text-sm text-slate-700">${item.price.toFixed(2)}</div>
                            </td>
                            <td className="py-3 px-4 align-top">
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-red-500 disabled:opacity-50 transition-colors"
                                        disabled={item.quantity <= 1}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <input
                                        type="number"
                                        data-item-id={item.id}
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                        className="w-12 text-center text-sm font-semibold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary focus:outline-none focus:ring-0 p-0"
                                    />
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-green-500 transition-colors"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-slate-900 align-top">
                                ${(item.price * item.quantity).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right align-top">
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Remove Item"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
