// ============================================================================
// PDF BASE DOCUMENT BUILDER
// ============================================================================

import type { Content, TDocumentDefinitions, Style } from "pdfmake/interfaces";
import type {
  PDFInvoiceData,
  PDFCompanyInfo,
  PDFGenerationOptions,
} from "../types";
import {
  PDF_THEME,
  DEFAULT_MARGINS,
  DOCUMENT_TITLES,
  FONT_SIZES,
} from "../constants";
import { buildHeader } from "../components/header";
import { buildItemsTable } from "../components/items-table";
import { buildAmounts } from "../components/amounts";
import { buildAmountInWords } from "../components/amount-in-words";
import { buildTermsAndSignature } from "../components/terms-signature";
import { formatDate } from "../utils/format-helpers";

/**
 * Build the details section (Bill To | Transport | Invoice Details)
 */
function buildDetailsSection(
  data: PDFInvoiceData,
  _options: PDFGenerationOptions
): Content {
  // Build party info (Bill To / Supplier)
  const partyStack: Content[] = [
    {
      text: data.partyLabel,
      fontSize: FONT_SIZES.sectionHeader,
      bold: true,
      color: PDF_THEME.primaryColor,
      margin: [0, 0, 0, 5],
    },
    {
      text: data.partyInfo.name,
      fontSize: FONT_SIZES.normal,
      bold: true,
      margin: [0, 0, 0, 2],
    },
  ];

  if (data.partyInfo.address) {
    partyStack.push({
      text: data.partyInfo.address,
      fontSize: FONT_SIZES.small,
      color: PDF_THEME.mutedColor,
    });
  }

  const cityState = [data.partyInfo.city, data.partyInfo.state]
    .filter(Boolean)
    .join(", ");
  if (cityState) {
    partyStack.push({
      text: cityState,
      fontSize: FONT_SIZES.small,
      color: PDF_THEME.mutedColor,
    });
  }

  if (data.partyInfo.phone) {
    partyStack.push({
      text: `Ph: ${data.partyInfo.phone}`,
      fontSize: FONT_SIZES.small,
      color: PDF_THEME.mutedColor,
      margin: [0, 3, 0, 0],
    });
  }

  if (data.partyInfo.email) {
    partyStack.push({
      text: data.partyInfo.email,
      fontSize: FONT_SIZES.small,
      color: PDF_THEME.mutedColor,
    });
  }

  // Build invoice details
  const invoiceStack: Content[] = [
    {
      text: "Document Details",
      fontSize: FONT_SIZES.sectionHeader,
      bold: true,
      color: PDF_THEME.primaryColor,
      margin: [0, 0, 0, 5],
    },
    {
      text: `No: ${data.documentNumber}`,
      fontSize: FONT_SIZES.small,
      margin: [0, 0, 0, 2],
    },
    {
      text: `Date: ${formatDate(data.date)}`,
      fontSize: FONT_SIZES.small,
      margin: [0, 0, 0, 2],
    },
  ];

  if (data.dueDate) {
    invoiceStack.push({
      text: `Due Date: ${formatDate(data.dueDate)}`,
      fontSize: FONT_SIZES.small,
      margin: [0, 0, 0, 2],
    });
  }

  if (data.validUntil) {
    invoiceStack.push({
      text: `Valid Until: ${formatDate(data.validUntil)}`,
      fontSize: FONT_SIZES.small,
      margin: [0, 0, 0, 2],
    });
  }

  // Build notes section (middle column - optional)
  const notesStack: Content[] = [];
  if (data.notes) {
    notesStack.push(
      {
        text: "Notes",
        fontSize: FONT_SIZES.sectionHeader,
        bold: true,
        color: PDF_THEME.primaryColor,
        margin: [0, 0, 0, 5],
      },
      {
        text: data.notes,
        fontSize: FONT_SIZES.tiny,
        color: PDF_THEME.mutedColor,
      }
    );
  }

  return {
    columns: [
      { width: "35%", stack: partyStack },
      { width: "30%", stack: notesStack.length > 0 ? notesStack : [{ text: "" }] },
      { width: "35%", stack: invoiceStack },
    ],
    margin: [0, 0, 0, 20],
  };
}

/**
 * Build the document title section
 */
function buildDocumentTitle(documentType: string): Content {
  return {
    text: DOCUMENT_TITLES[documentType] || "DOCUMENT",
    fontSize: FONT_SIZES.documentTitle,
    bold: true,
    alignment: "center",
    color: PDF_THEME.primaryColor,
    margin: [0, 10, 0, 15],
  };
}

/**
 * Get currency name for amount in words
 */
function getCurrencyName(currency = "USD"): { main: string; sub: string } {
  const defaultCurrency = { main: "Dollars", sub: "Cents" };
  const currencies: Record<string, { main: string; sub: string }> = {
    USD: defaultCurrency,
    PKR: { main: "Rupees", sub: "Paisa" },
    INR: { main: "Rupees", sub: "Paise" },
    EUR: { main: "Euros", sub: "Cents" },
    GBP: { main: "Pounds", sub: "Pence" },
  };
  return currencies[currency] ?? defaultCurrency;
}

/**
 * Build the base PDF document structure
 * This is used by all document type builders
 */
export function buildBaseDocument(
  data: PDFInvoiceData,
  companyInfo: PDFCompanyInfo,
  options: PDFGenerationOptions,
  customContent?: Content[]
): TDocumentDefinitions {
  const margins = options.margins ?? DEFAULT_MARGINS;
  const currencyNames = getCurrencyName(options.currency);

  // Build content array
  const content: Content[] = [
    // Company Header
    buildHeader(companyInfo, options.showLogo),

    // Document Title
    buildDocumentTitle(data.documentType),

    // Details Section (Bill To | Notes | Invoice Details)
    buildDetailsSection(data, options),

    // Items Table
    buildItemsTable(data.items, options.currency, options.locale),

    // Amounts Section
    buildAmounts(data, options.currency, options.locale),

    // Amount in Words
    buildAmountInWords(data.total, currencyNames.main, currencyNames.sub),
  ];

  // Add custom content if provided
  if (customContent && customContent.length > 0) {
    content.push(...customContent);
  }

  // Add Terms & Signature
  content.push(buildTermsAndSignature(data.terms, companyInfo, options));

  return {
    pageSize: options.paperSize as "A4" | "LETTER" | "LEGAL",
    pageMargins: [margins.left, margins.top, margins.right, margins.bottom],

    // 2px border around entire document (Med_rep style)
    background: function (_currentPage: number, pageSizeParam: { width: number; height: number }) {
      return {
        canvas: [
          {
            type: "rect" as const,
            x: 15,
            y: 15,
            w: pageSizeParam.width - 30,
            h: pageSizeParam.height - 30,
            lineWidth: 2,
            lineColor: PDF_THEME.borderColor,
          },
        ],
      };
    },

    content,

    styles: getStyles(),

    defaultStyle: {
      font: "Roboto",
      fontSize: FONT_SIZES.normal,
      color: PDF_THEME.textColor,
    },

    // Footer with page numbers
    footer: function (currentPage: number, pageCount: number) {
      return {
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: "center" as const,
        fontSize: FONT_SIZES.tiny,
        color: PDF_THEME.mutedColor,
        margin: [0, 10, 0, 0] as [number, number, number, number],
      };
    },
  };
}

/**
 * Get PDF styles
 */
function getStyles(): Record<string, Style> {
  return {
    documentTitle: {
      fontSize: FONT_SIZES.documentTitle,
      bold: true,
      alignment: "center",
      color: PDF_THEME.primaryColor,
    },
    sectionHeader: {
      fontSize: FONT_SIZES.sectionHeader,
      bold: true,
      color: PDF_THEME.primaryColor,
      margin: [0, 0, 0, 5],
    },
    tableHeader: {
      fontSize: FONT_SIZES.small,
      bold: true,
      color: "#ffffff",
      fillColor: PDF_THEME.headerBgColor,
    },
    tableCell: {
      fontSize: FONT_SIZES.small,
      margin: [2, 4, 2, 4],
    },
  };
}
