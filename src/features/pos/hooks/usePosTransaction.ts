import { useCallback } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import { usePosStore } from "../stores/pos-store";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export function usePosTransaction() {
    const {
        cart,
        customer,
        grandTotal,
        subtotal,
        discountTotal,
        taxTotal,
        billDiscount,
        clearCart
    } = usePosStore();

    const { user } = useAuthStore();

    const processTransaction = useCallback(async (paymentMode: "cash" | "card" | "other", amountPaid: number) => {
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }

        // Stock Validation
        for (const item of cart) {
            if (item.type === 'product' && (item.stockQuantity - item.quantity) < 0) {
                toast.error(`Insufficient stock for ${item.name}. Available: ${item.stockQuantity}`);
                return;
            }
        }

        const db = getPowerSyncDatabase();
        const invoiceId = uuidv4();
        const now = new Date().toISOString();
        const totalAmount = grandTotal();

        // Generate Invoice Number (Simple fallback, ideally should come from a sequence generator)
        const invoiceNumber = `POS-${Date.now().toString().slice(-6)}`;

        try {
            await db.writeTransaction(async (tx) => {
                // 1. Create Sale Invoice
                await tx.execute(
                    `INSERT INTO sale_invoices (
                    id, user_id, invoice_number, invoice_name, customer_id, customer_name,
                    date, due_date, status, subtotal, tax_amount, discount_amount,
                    total, amount_paid, amount_due, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        invoiceId,
                        user?.id,
                        invoiceNumber,
                        "POS Sale",
                        customer?.id || null,
                        customer?.name || "Walk-in Customer",
                        now,
                        now, // Due immediately
                        "paid", // POS is immediate payment usually
                        subtotal(),
                        taxTotal(),
                        discountTotal(),
                        totalAmount, // This comes from grandTotal() which includes billDiscount
                        amountPaid, // Assuming full payment for now
                        Math.max(0, totalAmount - amountPaid),
                        now,
                        now
                    ]
                );

                // 2. Create Invoice Items & Update Stock
                for (const item of cart) {
                    const lineId = uuidv4();
                    const itemTotal = item.price * item.quantity;
                    const itemDiscount = item.discountType === "percentage"
                        ? itemTotal * (item.discount / 100)
                        : item.discount * item.quantity;

                    // Add Item Record
                    await tx.execute(
                        `INSERT INTO sale_invoice_items (
                        id, user_id, invoice_id, item_id, item_name, 
                        quantity, unit, unit_price, mrp, 
                        discount_percent, tax_percent, amount
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            lineId,
                            user?.id,
                            invoiceId,
                            item.id,
                            item.name,
                            item.quantity,
                            item.unit,
                            item.price,
                            item.salePrice, // MRP
                            item.discountType === "percentage" ? item.discount : 0, // Store % if applicable
                            item.taxRate || 0,
                            itemTotal - itemDiscount
                        ]
                    );

                    // Update Stock
                    await tx.execute(
                        `UPDATE items SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?`,
                        [item.quantity, now, item.id]
                    );
                }

                // 3. Record Payment
                const paymentId = uuidv4();
                await tx.execute(
                    `INSERT INTO payment_ins (
                    id, user_id, receipt_number, customer_id, customer_name,
                    date, amount, payment_mode, invoice_id, invoice_number,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        paymentId,
                        user?.id,
                        `RCT-${Date.now().toString().slice(-6)}`,
                        customer?.id || null,
                        customer?.name || "Walk-in Customer",
                        now,
                        amountPaid,
                        paymentMode,
                        invoiceId,
                        invoiceNumber,
                        now,
                        now
                    ]
                );
            });

            toast.success(`Sale completed! Invoice: ${invoiceNumber}`);
            clearCart();
            return invoiceId;

        } catch (error) {
            console.error("Transaction failed:", error);
            toast.error("Transaction failed. Please try again.");
            throw error;
        }
    }, [cart, customer, grandTotal, subtotal, discountTotal, taxTotal, user, clearCart]);

    return { processTransaction };
}
