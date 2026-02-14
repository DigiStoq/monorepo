import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Item } from "@/features/inventory/types";
import type { Customer } from "@/features/customers/types";

export interface PosCartItem extends Item {
    quantity: number;
    discount: number; // Percentage
    discountType: "percentage" | "fixed";
    price: number; // Override price if needed
}

interface PosState {
    // Cart
    cart: PosCartItem[];
    addItem: (item: Item) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    updateItemPrice: (itemId: string, price: number) => void;
    updateItemDiscount: (itemId: string, discount: number, type: "percentage" | "fixed") => void;
    clearCart: () => void;

    // Transaction Meta
    customer: Customer | null;
    setCustomer: (customer: Customer | null) => void;

    // Bill Level
    billDiscount: number;
    billDiscountType: "percentage" | "fixed";
    setBillDiscount: (discount: number, type: "percentage" | "fixed") => void;

    // Totals (Computed helpers)
    subtotal: () => number;
    taxTotal: () => number;
    discountTotal: () => number;
    grandTotal: () => number;

    // UI State
    isSearchOpen: boolean;
    setSearchOpen: (open: boolean) => void;
    selectedItemId: string | null;
    setSelectedItem: (itemId: string | null) => void;
}

export const usePosStore = create<PosState>()(
    persist(
        (set, get) => ({
            cart: [],
            customer: null,
            billDiscount: 0,
            billDiscountType: "percentage",
            isSearchOpen: false,
            selectedItemId: null,

            addItem: (item) =>
                set((state) => {
                    const existing = state.cart.find((i) => i.id === item.id);
                    if (existing) {
                        return {
                            cart: state.cart.map((i) =>
                                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                            ),
                            selectedItemId: item.id, // Auto-select updated item
                        };
                    }
                    return {
                        cart: [
                            ...state.cart,
                            {
                                ...item,
                                quantity: 1,
                                discount: 0,
                                discountType: "percentage",
                                price: item.salePrice,
                            },
                        ],
                        selectedItemId: item.id, // Auto-select new item
                    };
                }),

            removeItem: (itemId) =>
                set((state) => ({
                    cart: state.cart.filter((i) => i.id !== itemId),
                    selectedItemId: state.selectedItemId === itemId ? null : state.selectedItemId,
                })),

            updateQuantity: (itemId, quantity) =>
                set((state) => ({
                    cart: state.cart.map((i) =>
                        i.id === itemId ? { ...i, quantity: Math.max(0, quantity) } : i
                    ),
                    selectedItemId: itemId, // Select when modifying
                })),

            updateItemPrice: (itemId, price) =>
                set((state) => ({
                    cart: state.cart.map((i) =>
                        i.id === itemId ? { ...i, price: Math.max(0, price) } : i
                    ),
                    selectedItemId: itemId,
                })),

            updateItemDiscount: (itemId, discount, type) =>
                set((state) => ({
                    cart: state.cart.map((i) =>
                        i.id === itemId ? { ...i, discount, discountType: type } : i
                    ),
                    selectedItemId: itemId,
                })),

            clearCart: () => set({ cart: [], customer: null, billDiscount: 0, selectedItemId: null }),

            setCustomer: (customer) => set({ customer }),

            setBillDiscount: (discount, type) =>
                set({ billDiscount: discount, billDiscountType: type }),

            setSearchOpen: (open) => set({ isSearchOpen: open }),

            setSelectedItem: (itemId) => set({ selectedItemId: itemId }),

            subtotal: () => {
                const { cart } = get();
                return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
            },

            discountTotal: () => {
                const { cart, billDiscount, billDiscountType, subtotal } = get();

                // 1. Calculate Item Level Discounts
                const itemDiscountTotal = cart.reduce((acc, item) => {
                    const itemTotal = item.price * item.quantity;
                    const discountAmount =
                        item.discountType === "percentage"
                            ? itemTotal * (item.discount / 100)
                            : item.discount * item.quantity; // Fixed discount per unit
                    return acc + discountAmount;
                }, 0);

                // 2. Calculate Bill Level Discount (on remaining amount)
                const subAfterItemDisc = subtotal() - itemDiscountTotal;
                const billDiscountAmount =
                    billDiscountType === "percentage"
                        ? subAfterItemDisc * (billDiscount / 100)
                        : billDiscount;

                return itemDiscountTotal + billDiscountAmount;
            },

            taxTotal: () => {
                // Simplified tax calculation (assuming tax exclusive for now)
                // In real app, we need to handle tax inclusive/exclusive logic from settings
                const { cart } = get();
                return cart.reduce((acc, item) => {
                    const taxableAmount = (item.price * item.quantity);
                    // Logic needs refinement if item discount applies BEFORE or AFTER tax
                    // Usually Tax is on (Price - Discount)
                    const discountAmount = item.discountType === "percentage"
                        ? taxableAmount * (item.discount / 100)
                        : item.discount * item.quantity;

                    const netAmount = taxableAmount - discountAmount;
                    return acc + (netAmount * (item.taxRate || 0) / 100);
                }, 0);
            },

            grandTotal: () => {
                const { subtotal, discountTotal, taxTotal, billDiscount, billDiscountType } = get();
                // Since discountTotal includes bill discount, we just do:
                // Subtotal - All Discounts + Tax
                // Note: Logic above in discountTotal applied bill discount on (Sub - ItemDisc).
                // Let's rely on properly executing the sequence:

                const sub = subtotal();

                // Available for Bill Discount
                let currentTotal = sub;

                // Item Discounts
                const itemDiscounts = get().cart.reduce((acc, item) => {
                    const amount = item.price * item.quantity;
                    const disc = item.discountType === "percentage" ? amount * (item.discount / 100) : item.discount * item.quantity;
                    return acc + disc;
                }, 0);

                currentTotal -= itemDiscounts;

                // Bill Discount
                const billDiscAmount = billDiscountType === "percentage" ? currentTotal * (billDiscount / 100) : billDiscount;
                currentTotal -= billDiscAmount;

                // Tax (Simple approximation: Tax on Final Amount vs Tax on Item Lines)
                // Correct way: Sum of (Item Net * Tax Rate)
                // We need to distribute bill discount to items to get accurate tax if tax rates vary per item.
                // For MVP: We will calculate tax on line items after line discount, and ignore bill discount impact on tax base for now OR apply it proportionally.
                // Let's stick to: Tax is calculated on (Item Price - Item Discount). Bill discount is extra (financial discount).

                const tax = get().cart.reduce((acc, item) => {
                    const amount = item.price * item.quantity;
                    const itemDisc = item.discountType === "percentage" ? amount * (item.discount / 100) : item.discount * item.quantity;
                    const taxable = amount - itemDisc;
                    return acc + (taxable * ((item.taxRate || 0) / 100));
                }, 0);

                return currentTotal + tax;
            }
        }),
        {
            name: "pos-storage", // unique name
            partialize: (state) => ({
                cart: state.cart,
                customer: state.customer,
                billDiscount: state.billDiscount,
                billDiscountType: state.billDiscountType
            }), // only persist transaction data
        }
    )
);
