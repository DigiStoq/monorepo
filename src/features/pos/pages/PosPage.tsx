import { useRef, useState, useEffect } from "react";
import { PosCart } from "../components/PosCart";
import { PosItemSearch } from "../components/PosItemSearch";
import { PosTotals } from "../components/PosTotals";
import { PosItemDiscountModal } from "../components/PosItemDiscountModal";
import { PosCustomerModal } from "../components/PosCustomerModal";
import { PosRecentTransactions } from "../components/PosRecentTransactions";
import { PosSettingsModal } from "../components/PosSettingsModal";
import { usePosStore } from "../stores/pos-store";
import { toast } from "sonner";
import { History, Settings, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function PosPage() {
    const { cart, removeItem, selectedItemId, setSelectedItem } = usePosStore();

    // UI State
    const [showItemDiscount, setShowItemDiscount] = useState(false);
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [showRecentTransactions, setShowRecentTransactions] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Global shortcuts
            if (e.key === "F1") {
                e.preventDefault();
                document.querySelector<HTMLInputElement>("input[placeholder*='Scan']")?.focus();
            }
            if (e.key === "F2") {
                // Focus quantity of selected item
                e.preventDefault();
                if (selectedItemId) {
                    const qtyInput = document.querySelector<HTMLInputElement>(`input[data-item-id="${selectedItemId}"]`);
                    qtyInput?.focus();
                    qtyInput?.select();
                } else if (cart.length > 0) {
                    // If nothing selected, select first and focus
                    setSelectedItem(cart[0].id);
                    // Need a small timeout or state update to propagate
                    setTimeout(() => {
                        const qtyInput = document.querySelector<HTMLInputElement>(`input[data-item-id="${cart[0].id}"]`);
                        qtyInput?.focus();
                        qtyInput?.select();
                    }, 50);
                }
            }
            if (e.key === "F3") {
                // Item Discount
                e.preventDefault();
                if (selectedItemId) {
                    setShowItemDiscount(true);
                } else {
                    toast.warning("Select an item first to apply discount");
                }
            }
            if (e.key === "F4" || e.key === "Delete") {
                // Remove Item
                e.preventDefault();
                if (selectedItemId) {
                    removeItem(selectedItemId);
                } else {
                    toast.info("Select an item to remove");
                }
            }
            if (e.key === "F9") {
                // Pay / Checkout
                e.preventDefault();
                const checkoutBtn = document.querySelector<HTMLButtonElement>("button[data-action='checkout']");
                checkoutBtn?.click();
            }
            if (e.key === "F11") {
                // Customer Search
                e.preventDefault();
                setShowCustomerSearch(true);
            }

            // Cart Navigation (Arrow Keys)
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                const activeTag = document.activeElement?.tagName.toLowerCase();
                // Allow nav if not in input, OR if in search input but it's empty/not handling specific keys
                if (activeTag === 'input' || activeTag === 'textarea') {
                    if (document.activeElement?.getAttribute('data-item-id')) {
                        return; // Editing quantity
                    }
                    // If in search box, maybe allow down arrow to move to list? 
                    // For now, let's keep it simple: strict cart nav when not editing.
                }

                if (cart.length === 0) return;

                const currentIndex = cart.findIndex(i => i.id === selectedItemId);
                e.preventDefault();

                if (currentIndex === -1) {
                    setSelectedItem(cart[0].id);
                } else {
                    let newIndex = e.key === "ArrowUp" ? currentIndex - 1 : currentIndex + 1;
                    if (newIndex < 0) newIndex = 0;
                    if (newIndex >= cart.length) newIndex = cart.length - 1;
                    setSelectedItem(cart[newIndex].id);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [cart, selectedItemId, removeItem, setSelectedItem]);

    return (
        <div className="h-full flex flex-col bg-slate-100">
            {/* POS HEADER */}
            <div className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0 shadow-md z-40">
                <div className="flex items-center gap-4">
                    <Link to="/" className="font-bold text-xl tracking-tight hover:text-primary transition-colors">
                        DigiStoq POS
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-300 hover:text-white hover:bg-slate-800"
                        onClick={() => setShowRecentTransactions(!showRecentTransactions)}
                        title="Recent Transactions"
                    >
                        <History className="h-5 w-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-300 hover:text-white hover:bg-slate-800"
                        onClick={() => setShowSettings(true)}
                        title="POS Settings"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>

                    <Link to="/">
                        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-400 hover:bg-slate-800" title="Exit POS">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* LEFT PANEL: Bill / Cart */}
                <div className="flex-1 flex flex-col h-full bg-white shadow-sm z-10">
                    {/* Top: Search Bar */}
                    <div className="p-3 border-b border-slate-100 flex gap-3">
                        <div className="flex-1">
                            <PosItemSearch />
                        </div>
                    </div>

                    {/* Middle: Cart Items Table */}
                    <div className="flex-1 overflow-hidden relative">
                        <PosCart />
                    </div>

                    {/* Bottom: Action Bar / Shortcuts Hint */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50 text-[10px] md:text-xs text-slate-400 flex justify-between select-none">
                        <div className="flex gap-4">
                            <span>F1: Search</span>
                            <span>F2: Qty</span>
                            <span>F3: Disc</span>
                            <span>F4: Delete</span>
                            <span>F11: Customer</span>
                        </div>
                        <div>
                            <span>Space/F9: Pay</span>
                        </div>
                    </div>
                </div>

                {/* MIDDLE PANEL: Totals & Payment */}
                <div className={`w-full md:w-[380px] lg:w-[420px] bg-slate-50 flex flex-col h-full shrink-0 border-l border-slate-200 z-20 transition-all duration-300 ${showRecentTransactions ? 'hidden xl:flex' : 'flex'}`}>
                    {/* Header removed as requested, moved to main header */}
                    <PosTotals />
                </div>

                {/* RIGHT PANEL: Recent Transactions (Collapsible) */}
                {showRecentTransactions && (
                    <div className="absolute inset-y-0 right-0 z-30 md:static md:z-0 h-full shadow-2xl md:shadow-none animate-in slide-in-from-right duration-300">
                        <PosRecentTransactions onClose={() => setShowRecentTransactions(false)} />
                    </div>
                )}

                {/* MODALS */}
                {selectedItemId && (
                    <PosItemDiscountModal
                        open={showItemDiscount}
                        onClose={() => setShowItemDiscount(false)}
                    />
                )}
                <PosCustomerModal
                    open={showCustomerSearch}
                    onClose={() => setShowCustomerSearch(false)}
                />
                <PosSettingsModal
                    open={showSettings}
                    onClose={() => setShowSettings(false)}
                />
            </div>
        </div>
    );
}
