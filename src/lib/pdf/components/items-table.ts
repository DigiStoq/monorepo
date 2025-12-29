// ============================================================================
// PDF ITEMS TABLE COMPONENT
// ============================================================================

import type { Content, TableCell } from "pdfmake/interfaces";
import type { PDFLineItem } from "../types";
import { PDF_THEME, LIGHT_PURPLE, FONT_SIZES, ITEMS_TABLE_WIDTHS } from "../constants";
import { formatCurrency, formatPercent } from "../utils/format-helpers";

/**
 * Build the items table
 * Columns: #, Item Name, Qty, Rate, Disc%, Amount
 */
export function buildItemsTable(
  items: PDFLineItem[],
  currency = "USD",
  locale = "en-US"
): Content {
  const tableBody: TableCell[][] = [];

  // Header row
  tableBody.push([
    {
      text: "#",
      style: "tableHeader",
      alignment: "center",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
    {
      text: "Item Name",
      style: "tableHeader",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
    {
      text: "Qty",
      style: "tableHeader",
      alignment: "right",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
    {
      text: "Rate",
      style: "tableHeader",
      alignment: "right",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
    {
      text: "Disc",
      style: "tableHeader",
      alignment: "right",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
    {
      text: "Amount",
      style: "tableHeader",
      alignment: "right",
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      margin: [0, 6, 0, 6],
    },
  ]);

  // Data rows
  items.forEach((item, index) => {
    const isAlternate = index % 2 === 1;
    const bgColor = isAlternate ? LIGHT_PURPLE : undefined;

    const itemNameContent: Content = item.description
      ? {
          stack: [
            { text: item.name, fontSize: FONT_SIZES.small, bold: true },
            {
              text: item.description,
              fontSize: FONT_SIZES.tiny,
              color: PDF_THEME.mutedColor,
              margin: [0, 2, 0, 0] as [number, number, number, number],
            },
          ],
        }
      : { text: item.name, fontSize: FONT_SIZES.small };

    const row: TableCell[] = [
      {
        text: (index + 1).toString(),
        alignment: "center" as const,
        fontSize: FONT_SIZES.small,
        fillColor: bgColor,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      },
      {
        ...itemNameContent,
        fillColor: bgColor,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      } as TableCell,
      {
        text: `${item.quantity} ${item.unit}`,
        alignment: "right" as const,
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
        alignment: "right" as const,
        fontSize: FONT_SIZES.small,
        fillColor: bgColor,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      },
      {
        text: formatCurrency(item.amount, currency, locale),
        alignment: "right" as const,
        fontSize: FONT_SIZES.small,
        bold: true,
        fillColor: bgColor,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      },
    ];

    tableBody.push(row);
  });

  return {
    table: {
      headerRows: 1,
      widths: ITEMS_TABLE_WIDTHS,
      body: tableBody,
    },
    layout: {
      hLineWidth: (i: number, node: { table: { body: TableCell[][] } }) => {
        return i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5;
      },
      vLineWidth: () => 0.5,
      hLineColor: () => PDF_THEME.borderColor,
      vLineColor: () => PDF_THEME.borderColor,
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 15],
  };
}
