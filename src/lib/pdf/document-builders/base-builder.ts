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
import { numberToWords } from "../utils/number-to-words";
import { formatCurrency, formatDate } from "../utils/format-helpers";

/**
 * Build the section headers (Bill To | Transportation Details | Invoice Details)
 */
function buildSectionHeaders(): Content {
  return {
    table: {
      widths: ["33.33%", "33.33%", "33.34%"],
      body: [
        [
          {
            text: "Bill To",
            fillColor: PDF_THEME.headerBgColor,
            color: "#ffffff",
            bold: true,
            fontSize: FONT_SIZES.small,
            margin: [4, 4, 4, 4],
          },
          {
            text: "Transportation Details",
            fillColor: PDF_THEME.headerBgColor,
            color: "#ffffff",
            bold: true,
            fontSize: FONT_SIZES.small,
            margin: [4, 4, 4, 4],
          },
          {
            text: "Invoice Details",
            fillColor: PDF_THEME.headerBgColor,
            color: "#ffffff",
            bold: true,
            fontSize: FONT_SIZES.small,
            margin: [4, 4, 4, 4],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => PDF_THEME.borderColor,
      vLineColor: () => PDF_THEME.borderColor,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
}

/**
 * Build the details section (Bill To | Transport | Invoice Details)
 */
function buildDetailsSection(
  data: PDFInvoiceData,
  _options: PDFGenerationOptions
): Content {
  // Build Bill To content
  const billToContent: Content[] = [
    {
      text: data.partyInfo.name,
      fontSize: FONT_SIZES.normal,
      bold: true,
      margin: [0, 0, 0, 3],
    },
  ];

  if (data.partyInfo.address) {
    billToContent.push({
      text: data.partyInfo.address,
      fontSize: FONT_SIZES.small,
      margin: [0, 0, 0, 2],
    });
  }

  const cityState = [data.partyInfo.city, data.partyInfo.state]
    .filter(Boolean)
    .join(", ");
  if (cityState) {
    billToContent.push({
      text: cityState,
      fontSize: FONT_SIZES.small,
    });
  }

  // Build Transportation Details content
  const transportContent: Content[] = [
    {
      text: [
        { text: "Transport Name: ", bold: true, fontSize: FONT_SIZES.small },
        { text: data.transportName ?? "-", fontSize: FONT_SIZES.small },
      ],
      margin: [0, 0, 0, 3],
    },
    {
      text: [
        { text: "Delivery Date: ", bold: true, fontSize: FONT_SIZES.small },
        {
          text: data.deliveryDate ? formatDate(data.deliveryDate) : "-",
          fontSize: FONT_SIZES.small,
        },
      ],
      margin: [0, 0, 0, 3],
    },
    {
      text: [
        { text: "Delivery location: ", bold: true, fontSize: FONT_SIZES.small },
        { text: data.deliveryLocation ?? "-", fontSize: FONT_SIZES.small },
      ],
    },
  ];

  // Build Invoice Details content
  const invoiceContent: Content[] = [
    {
      text: [
        { text: "Invoice No.: ", bold: true, fontSize: FONT_SIZES.small },
        { text: data.documentNumber, fontSize: FONT_SIZES.small },
      ],
      margin: [0, 0, 0, 3],
    },
    {
      text: [
        { text: "Date: ", bold: true, fontSize: FONT_SIZES.small },
        { text: formatDate(data.date), fontSize: FONT_SIZES.small },
      ],
    },
  ];

  return {
    table: {
      widths: ["33.33%", "33.33%", "33.34%"],
      body: [
        [
          {
            stack: billToContent,
            margin: [4, 4, 4, 4],
          },
          {
            stack: transportContent,
            margin: [4, 4, 4, 4],
          },
          {
            stack: invoiceContent,
            margin: [4, 4, 4, 4],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => PDF_THEME.borderColor,
      vLineColor: () => PDF_THEME.borderColor,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
}

/**
 * Build the document title section (appears at very top, above borders)
 */
function buildDocumentTitleHeader(documentType: string): Content {
  return {
    text: DOCUMENT_TITLES[documentType] || "DOCUMENT",
    fontSize: FONT_SIZES.documentTitle,
    bold: true,
    alignment: "center",
    margin: [0, 0, 0, 5],
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
  options: PDFGenerationOptions
): TDocumentDefinitions {
  const margins = options.margins ?? DEFAULT_MARGINS;
  // currencyNames unused here

  // Build content array
  const content: Content[] = [
    // Document Title (appears above the bordered container)
    buildDocumentTitleHeader(data.documentType),

    // Company Header (inside bordered container)
    buildHeader(companyInfo, options.showLogo),

    // Section Headers (Bill To | Transportation Details | Invoice Details)
    buildSectionHeaders(),

    // Details Section content
    buildDetailsSection(data, options),

    // Items Table
    buildItemsTable(data.items, options.currency, options.locale),

    // Footer Layout (Amounts, Words, Terms, Signature)
    buildFooterLayout(data, companyInfo, options),
  ];

  return {
    pageSize: options.paperSize as "A4" | "LETTER" | "LEGAL",
    pageMargins: [margins.left, margins.top, margins.right, margins.bottom],

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
 * Build the footer layout (2 columns: Words/Terms | Amounts/Signature)
 */
function buildFooterLayout(
  data: PDFInvoiceData,
  companyInfo: PDFCompanyInfo,
  options: PDFGenerationOptions
): Content {
  const currency = options.currency ?? "USD";
  const locale = options.locale ?? "en-US";
  const currencyNames = getCurrencyName(currency);
  const amountWords = numberToWords(
    data.total,
    currencyNames.main,
    currencyNames.sub
  );

  // --- Components ---

  // 1. Amounts Section (Right Side)
  const amountsRows: Content[][] = [];

  // Header Row
  amountsRows.push([
    {
      text: "Amounts",
      colSpan: 2,
      fillColor: PDF_THEME.headerBgColor,
      color: "#ffffff",
      bold: true,
      fontSize: FONT_SIZES.small,
      alignment: "left",
      border: [true, true, true, true],
      margin: [2, 2, 2, 2],
    } as unknown as Content,
    {} as unknown as Content,
  ]);

  const addAmountRow = (
    label: string,
    value: number,
    isTotal = false,
    isBold = false
  ): void => {
    // If it's Total, we remove the bottom border to merge with Received
    // If it's Received (which follows Total), we rely on its top border (false by default)
    // To be safe, we'll explicitly handle the borders.

    // Default borders: [left, top, right, bottom]
    let borders = [true, false, true, true];

    // If it's the Total row, remove the bottom border
    if (label === "Total") {
      borders = [true, false, true, false];
    }

    amountsRows.push([
      {
        text: label,
        fontSize: isTotal ? FONT_SIZES.normal : FONT_SIZES.small,
        bold: isTotal || isBold,
        margin: [5, 4, 5, 4],
        border: borders,
      } as unknown as Content,
      {
        text: formatCurrency(value, currency, locale),
        fontSize: isTotal ? FONT_SIZES.normal : FONT_SIZES.small,
        alignment: "right",
        bold: isTotal || isBold,
        margin: [5, 4, 5, 4],
        border: borders,
      } as unknown as Content,
    ]);
  };

  addAmountRow("Sub Total", data.subtotal);
  if (data.discountAmount > 0) addAmountRow("Discount", -data.discountAmount);
  if (data.taxAmount > 0) addAmountRow("Tax", data.taxAmount);
  addAmountRow("Total", data.total, true);
  addAmountRow("Received", data.amountPaid ?? 0);
  addAmountRow("Balance", data.amountDue ?? 0);

  // 2. Amount In Words (Left Side) - Table to support Header Background
  const amountInWordsTable = {
    widths: ["*"],
    body: [
      [
        {
          text: "Invoice Amount In Words",
          fillColor: PDF_THEME.headerBgColor,
          color: "#ffffff",
          bold: true,
          fontSize: FONT_SIZES.small,
          alignment: "center",
          border: [true, true, true, true],
          margin: [0, 2, 0, 2],
        },
      ],
      [
        {
          text: amountWords,
          fontSize: FONT_SIZES.small,
          alignment: "center",
          margin: [5, 8, 5, 8],
          border: [true, false, true, true],
        },
      ],
    ],
  };

  // 3. Terms (Left Side) - Table to support Header Background
  const termsText = (data.terms ?? "").replace(
    /{{COMPANY_NAME}}/g,
    companyInfo.name
  );

  const termsTable = {
    widths: ["*"],
    body: [
      [
        {
          text: "Terms and Conditions",
          fillColor: PDF_THEME.headerBgColor,
          color: "#ffffff",
          bold: true,
          fontSize: FONT_SIZES.small,
          alignment: "center",
          border: [true, true, true, true],
          margin: [0, 2, 0, 2],
        },
      ],
      [
        {
          text: termsText,
          fontSize: FONT_SIZES.tiny,
          alignment: "justify",
          margin: [5, 5, 5, 5],
          border: [true, false, true, true],
        },
      ],
    ],
  };

  // --- Main Layout Table ---
  return {
    table: {
      widths: ["60%", "40%"],
      body: [
        // ROW 1: Empty Left | Amounts Right
        [
          {
            text: "",
            border: [true, true, true, true],
          } as unknown as Content,
          {
            // Nested table for Amounts
            table: {
              widths: ["*", "auto"],
              body: amountsRows,
            },
            layout: {
              hLineWidth: (i: number) => (i === 0 || i === 1 ? 0 : 0.5),
              vLineWidth: () => 0.5,
              hLineColor: () => PDF_THEME.borderColor,
              vLineColor: () => PDF_THEME.borderColor,
            },
            border: [false, false, false, false],
            margin: [-1, -1, -1, -1],
          } as unknown as Content,
        ],
        // ROW 2: Words Left | Empty Right
        [
          {
            // Nested Table for Words via explicit properties to avoid Lint Error
            table: amountInWordsTable,
            layout: {
              hLineWidth: (i: number) => (i === 0 ? 0 : 0.5),
              vLineWidth: () => 0.5,
              hLineColor: () => PDF_THEME.borderColor,
              vLineColor: () => PDF_THEME.borderColor,
            },
            border: [false, false, false, false],
            margin: [-1, -1, -1, -1],
          } as unknown as Content,
          {
            text: "",
            border: [false, false, true, true],
          } as unknown as Content,
        ],
        // ROW 3: Terms Left | Signature Right
        [
          {
            // Nested Table for Terms
            table: termsTable,
            layout: {
              hLineWidth: (i: number) => (i === 0 ? 0 : 0.5),
              vLineWidth: () => 0.5,
              hLineColor: () => PDF_THEME.borderColor,
              vLineColor: () => PDF_THEME.borderColor,
            },
            border: [false, false, false, false],
            margin: [-1, -1, -1, -1],
          } as unknown as Content,
          {
            // Signature Block
            stack: [
              {
                text: `For : ${companyInfo.name}`,
                fontSize: FONT_SIZES.small,
                alignment: "center",
                margin: [0, 10, 0, 35],
              },
              {
                text: "Authorized Signatory",
                fontSize: FONT_SIZES.small,
                bold: true,
                alignment: "center",
                margin: [0, 0, 0, 5],
              },
            ],
            border: [false, false, true, true],
          } as unknown as Content,
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => PDF_THEME.borderColor,
      vLineColor: () => PDF_THEME.borderColor,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
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
