// ============================================================================
// PDF AMOUNTS COMPONENT
// ============================================================================

import type { Content } from "pdfmake/interfaces";
import type { PDFInvoiceData } from "../types";
import { PDF_THEME, FONT_SIZES } from "../constants";
import { formatCurrency } from "../utils/format-helpers";

interface AmountRow {
  label: string;
  value: number;
  isDiscount?: boolean;
  isTotal?: boolean;
  isBold?: boolean;
}

/**
 * Build a single amount row
 */
function buildAmountRow(
  row: AmountRow,
  currency = "USD",
  locale = "en-US"
): Content {
  const formattedValue = formatCurrency(Math.abs(row.value), currency, locale);
  const displayValue = row.isDiscount ? `-${formattedValue}` : formattedValue;

  return {
    columns: [
      {
        text: row.label,
        width: 120,
        alignment: "right",
        fontSize: row.isTotal ? FONT_SIZES.header : FONT_SIZES.normal,
        bold: row.isTotal || row.isBold,
        color: row.isTotal ? PDF_THEME.primaryColor : PDF_THEME.textColor,
      },
      {
        text: displayValue,
        width: 80,
        alignment: "right",
        fontSize: row.isTotal ? FONT_SIZES.header : FONT_SIZES.normal,
        bold: row.isTotal || row.isBold,
        color: row.isTotal ? PDF_THEME.primaryColor : PDF_THEME.textColor,
      },
    ],
    margin: [0, row.isTotal ? 4 : 2, 0, row.isTotal ? 4 : 2],
  };
}

/**
 * Build the amounts section
 * Shows: Subtotal, Discount, Tax, Total, Amount Paid, Balance Due
 */
export function buildAmounts(
  data: PDFInvoiceData,
  currency = "USD",
  locale = "en-US"
): Content {
  const rows: AmountRow[] = [];

  // Subtotal
  rows.push({ label: "Sub Total:", value: data.subtotal });

  // Discount (if any)
  if (data.discountAmount > 0) {
    rows.push({ label: "Discount:", value: data.discountAmount, isDiscount: true });
  }

  // Tax (if any)
  if (data.taxAmount > 0) {
    rows.push({ label: "Tax:", value: data.taxAmount });
  }

  // Total
  rows.push({ label: "Total:", value: data.total, isTotal: true });

  // Amount Paid (for invoices with payments)
  if (data.amountPaid !== undefined && data.amountPaid > 0) {
    rows.push({ label: "Received:", value: data.amountPaid, isBold: true });
  }

  // Balance Due (for invoices)
  if (data.amountDue !== undefined && data.amountDue > 0) {
    rows.push({ label: "Balance:", value: data.amountDue, isTotal: true });
  }

  return {
    columns: [
      { width: "*", text: "" },
      {
        width: 220,
        stack: rows.map((row) => buildAmountRow(row, currency, locale)),
      },
    ],
    margin: [0, 0, 0, 10],
  };
}

/**
 * Build amounts section with a border/background
 */
export function buildAmountsWithBorder(
  data: PDFInvoiceData,
  currency = "USD",
  locale = "en-US"
): Content {
  return {
    columns: [
      { width: "*", text: "" },
      {
        width: 220,
        table: {
          widths: ["*"],
          body: [[buildAmounts(data, currency, locale)]],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => PDF_THEME.borderColor,
          vLineColor: () => PDF_THEME.borderColor,
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 10,
          paddingBottom: () => 10,
        },
      },
    ],
    margin: [0, 0, 0, 15],
  };
}
