import { PosCartItem } from "../stores/pos-store";
import { Customer } from "@/features/customers/types";

interface ReceiptData {
    storeName: string;
    storeAddress: string;
    customer?: Customer | null;
    items: PosCartItem[];
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    grandTotal: number;
    amountPaid: number;
    change: number;
    invoiceNumber: string;
    date: string;
}

export function generateReceiptText(data: ReceiptData): string {
    const {
        storeName,
        storeAddress,
        customer,
        items,
        subtotal,
        taxTotal,
        discountTotal,
        grandTotal,
        amountPaid,
        change,
        invoiceNumber,
        date,
    } = data;

    const line = "-".repeat(32);
    const center = (str: string) => {
        const padding = Math.max(0, (32 - str.length) / 2);
        return " ".repeat(padding) + str;
    };
    const row = (label: string, value: string) => {
        const space = 32 - label.length - value.length;
        return label + " ".repeat(Math.max(0, space)) + value;
    };

    let receipt = "";
    receipt += center(storeName) + "\n";
    receipt += center(storeAddress) + "\n";
    receipt += line + "\n";
    receipt += `Date: ${new Date(date).toLocaleString()}\n`;
    receipt += `Invoice: ${invoiceNumber}\n`;
    if (customer) {
        receipt += `Customer: ${customer.name}\n`;
    }
    receipt += line + "\n";

    items.forEach((item) => {
        receipt += `${item.name}\n`;
        const qtyPrice = `${item.quantity} x ${item.price.toFixed(2)}`;
        const total = (item.quantity * item.price).toFixed(2);
        receipt += row(qtyPrice, total) + "\n";
        if (item.discount > 0) {
            const discText = item.discountType === 'percentage' ? `${item.discount}%` : `$${item.discount}`;
            receipt += row("  Discount", `-${discText}`) + "\n";
        }
    });

    receipt += line + "\n";
    receipt += row("Subtotal", subtotal.toFixed(2)) + "\n";
    receipt += row("Tax", taxTotal.toFixed(2)) + "\n";
    receipt += row("Discount", `-${discountTotal.toFixed(2)}`) + "\n";
    receipt += line + "\n";
    receipt += row("TOTAL", grandTotal.toFixed(2)) + "\n";
    receipt += row("Paid (Cash)", amountPaid.toFixed(2)) + "\n";
    receipt += row("Change", change.toFixed(2)) + "\n";
    receipt += line + "\n";
    receipt += center("Thank you for shopping!") + "\n";

    return receipt;
}
