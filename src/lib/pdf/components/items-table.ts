// ============================================================================
// PDF ITEMS TABLE COMPONENT
// ============================================================================

import type { Content, TableCell } from "pdfmake/interfaces";
import type { PDFLineItem } from "../types";
import {
  PDF_THEME,
  LIGHT_PURPLE,
  FONT_SIZES,
  ITEMS_TABLE_WIDTHS,
} from "../constants";
import { formatCurrency, formatPercent } from "../utils/format-helpers";

/**
 * Build the items table
 * Columns: #, Item Name, No., MRP, Qty, Rate, Discount, Amount
 */
export function buildItemsTable(
  items: PDFLineItem[],
  currency = "USD",
  locale = "en-US"
): Content {
  const tableBody: TableCell[][] = [];

  // Header row with purple background
  tableBody.push([
    {
      text: "#",
      alignment: "center",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
    {
      text: "Item name",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
    {
      text: "No.",
      alignment: "center",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
    {
      text: "MRP",
      alignment: "right",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
    {
      text: "Quantity",
      alignment: "center",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
    {
      text: "Rate",
      alignment: "right",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
    {
      text: "Discount",
      alignment: "center",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
    {
      text: "Amount",
      alignment: "right",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
  ]);

  // Data rows
  let totalQty = 0;
  let totalMRP = 0;
  let totalAmount = 0;

  items.forEach((item, index) => {
    const isAlternate = index % 2 === 1;
    const bgColor = isAlternate ? LIGHT_PURPLE : undefined;

    totalQty += item.quantity;
    totalMRP += (item.mrp ?? item.unitPrice) * item.quantity;
    totalAmount += item.amount;

    const row: TableCell[] = [
      {
        text: (index + 1).toString(),
        alignment: "center" as const,
        fontSize: FONT_SIZES.small,
        fillColor: bgColor,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      },
      {
        text: item.name,
        fontSize: FONT_SIZES.small,
        fillColor: bgColor,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      },
      {
        text: item.batchNumber ?? "",
        alignment: "center" as const,
        fontSize: FONT_SIZES.small,
        fillColor: bgColor,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      },
      {
        text: item.mrp ? formatCurrency(item.mrp, currency, locale) : "",
        alignment: "right" as const,
        fontSize: FONT_SIZES.small,
        fillColor: bgColor,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      },
      {
        text: item.quantity.toString(),
        alignment: "center" as const,
        fontSize: FONT_SIZES.small,
        fillColor: bgColor,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      },
      {
        text: formatCurrency(item.unitPrice, currency, locale),
        alignment: "right" as const,
        fontSize: FONT_SIZES.small,
        fillColor: bgColor,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      },
      {
        text: formatPercent(item.discountPercent ?? 0),
        alignment: "center" as const,
        fontSize: FONT_SIZES.small,
        fillColor: bgColor,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      },
      {
        text: formatCurrency(item.amount, currency, locale),
        alignment: "right" as const,
        fontSize: FONT_SIZES.small,
        fillColor: bgColor,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      },
    ];

    tableBody.push(row);
  });

  // Total row
  tableBody.push([
    {
      text: "",
      fillColor: LIGHT_PURPLE,
      border: [true, true, false, true],
    },
    {
      text: "Total",
      bold: true,
      fontSize: FONT_SIZES.small,
      fillColor: LIGHT_PURPLE,
      margin: [0, 6, 0, 6] as [number, number, number, number],
      border: [false, true, false, true],
    },
    {
      text: "",
      fillColor: LIGHT_PURPLE,
      border: [false, true, false, true],
    },
    {
      text: "",
      fillColor: LIGHT_PURPLE,
      border: [false, true, false, true],
    },
    {
      text: totalQty.toString(),
      alignment: "center" as const,
      bold: true,
      fontSize: FONT_SIZES.small,
      fillColor: LIGHT_PURPLE,
      margin: [0, 6, 0, 6] as [number, number, number, number],
      border: [false, true, false, true],
    },
    {
      text: "",
      fillColor: LIGHT_PURPLE,
      border: [false, true, false, true],
    },
    {
      text: formatCurrency(totalMRP, currency, locale),
      alignment: "right" as const,
      bold: true,
      fontSize: FONT_SIZES.small,
      fillColor: LIGHT_PURPLE,
      margin: [0, 6, 0, 6] as [number, number, number, number],
      border: [false, true, false, true],
    },
    {
      text: formatCurrency(totalAmount, currency, locale),
      alignment: "right" as const,
      bold: true,
      fontSize: FONT_SIZES.small,
      fillColor: LIGHT_PURPLE,
      margin: [0, 6, 0, 6] as [number, number, number, number],
      border: [false, true, true, true],
    },
  ]);

  return {
    table: {
      headerRows: 1,
      widths: ITEMS_TABLE_WIDTHS,
      body: tableBody,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => PDF_THEME.borderColor,
      vLineColor: () => PDF_THEME.borderColor,
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 0],
  };
}
