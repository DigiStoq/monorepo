// ============================================================================
// MODERN PDF TEMPLATE
// Clean blue-gray design inspired by professional invoice templates
// ============================================================================

import type { Content, TDocumentDefinitions, Style } from "pdfmake/interfaces";
import type {
  PDFInvoiceData,
  PDFCompanyInfo,
  PDFGenerationOptions,
} from "../types";
import { TEMPLATE_THEMES, DOCUMENT_TITLES, FONT_SIZES } from "../constants";
import {
  formatCurrency,
  formatDate,
  formatAddress,
} from "../utils/format-helpers";
import { numberToWords } from "../utils/number-to-words";

const theme = TEMPLATE_THEMES.modern;
const HEADER_BG = "#D8E0EF";
const ALT_ROW_BG = "#E5E5E5";

/**
 * Build the header section with logo/company and billing info side by side
 */
function buildModernHeader(
  company: PDFCompanyInfo,
  data: PDFInvoiceData,
  showLogo: boolean
): Content {
  // Left side: Logo or company initial
  const leftContent: Content[] = [];

  if (showLogo && company.logoBase64) {
    leftContent.push({
      image: company.logoBase64,
      width: 80,
      margin: [0, 0, 0, 10],
    });
  } else {
    // Show company initial as a styled box
    const initial = company.name.charAt(0).toUpperCase();
    leftContent.push({
      table: {
        widths: [60],
        body: [
          [
            {
              text: initial,
              fontSize: 32,
              bold: true,
              color: "#ffffff",
              alignment: "center",
              fillColor: theme.primaryColor,
              margin: [0, 10, 0, 10],
            },
          ],
        ],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 10],
    });
  }

  leftContent.push({
    text: company.name,
    fontSize: 14,
    bold: true,
    color: theme.textColor,
  });

  if (company.address) {
    const addr = formatAddress(company.address);
    if (addr) {
      leftContent.push({
        text: addr,
        fontSize: 9,
        color: theme.mutedColor,
        margin: [0, 3, 0, 0],
      });
    }
  }

  if (company.phone) {
    leftContent.push({
      text: company.phone,
      fontSize: 9,
      color: theme.mutedColor,
      margin: [0, 2, 0, 0],
    });
  }

  if (company.email) {
    leftContent.push({
      text: company.email,
      fontSize: 9,
      color: theme.mutedColor,
    });
  }

  // Right side: Billing info
  const rightContent: Content[] = [
    {
      text: data.partyLabel,
      fontSize: 10,
      bold: true,
      color: theme.mutedColor,
      margin: [0, 0, 0, 5],
    },
    {
      text: data.partyInfo.name,
      fontSize: 12,
      bold: true,
      color: theme.textColor,
    },
  ];

  if (data.partyInfo.address) {
    rightContent.push({
      text: data.partyInfo.address,
      fontSize: 9,
      color: theme.mutedColor,
      margin: [0, 3, 0, 0],
    });
  }

  const cityState = [data.partyInfo.city, data.partyInfo.state]
    .filter(Boolean)
    .join(", ");
  if (cityState) {
    rightContent.push({
      text: cityState,
      fontSize: 9,
      color: theme.mutedColor,
    });
  }

  if (data.partyInfo.phone) {
    rightContent.push({
      text: data.partyInfo.phone,
      fontSize: 9,
      color: theme.mutedColor,
      margin: [0, 3, 0, 0],
    });
  }

  return {
    columns: [
      { width: "50%", stack: leftContent },
      { width: "50%", stack: rightContent },
    ],
    margin: [0, 0, 0, 20],
  };
}

/**
 * Build document title bar
 */
function buildTitleBar(data: PDFInvoiceData): Content {
  const title = DOCUMENT_TITLES[data.documentType] || "DOCUMENT";

  return {
    table: {
      widths: ["25%", "*", "*", "20%", "20%"],
      body: [
        [
          {
            text: title,
            fontSize: 20,
            bold: true,
            color: theme.primaryColor,
            margin: [0, 15, 0, 15],
          },
          { text: "", margin: [0, 15, 0, 15] },
          { text: "", margin: [0, 15, 0, 15] },
          {
            stack: [
              {
                text: "Invoice No.",
                fontSize: 9,
                color: theme.mutedColor,
                bold: true,
              },
              {
                text: data.documentNumber,
                fontSize: 11,
                bold: true,
                color: theme.textColor,
              },
            ],
            margin: [0, 10, 0, 10],
          },
          {
            stack: [
              {
                text: "Date",
                fontSize: 9,
                color: theme.mutedColor,
                bold: true,
              },
              {
                text: formatDate(data.date),
                fontSize: 11,
                bold: true,
                color: theme.textColor,
              },
            ],
            margin: [0, 10, 0, 10],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 0,
      hLineColor: () => theme.borderColor,
    },
    margin: [0, 0, 0, 20],
  };
}

/**
 * Build items table with modern styling
 */
function buildItemsTable(
  items: PDFInvoiceData["items"],
  currency = "USD",
  locale = "en-US"
): Content {
  const headerRow = [
    { text: "Item", fillColor: HEADER_BG, bold: true, margin: [10, 12, 5, 12] },
    {
      text: "Qty",
      fillColor: HEADER_BG,
      bold: true,
      alignment: "center",
      margin: [5, 12, 5, 12],
    },
    {
      text: "Rate",
      fillColor: HEADER_BG,
      bold: true,
      alignment: "right",
      margin: [5, 12, 5, 12],
    },
    {
      text: "Disc%",
      fillColor: HEADER_BG,
      bold: true,
      alignment: "center",
      margin: [5, 12, 5, 12],
    },
    {
      text: "Amount",
      fillColor: HEADER_BG,
      bold: true,
      alignment: "right",
      margin: [5, 12, 10, 12],
    },
  ];

  const itemRows = items.map((item, idx) => {
    const isAlt = idx % 2 === 1;
    const fillColor = isAlt ? ALT_ROW_BG : undefined;

    return [
      {
        stack: [
          { text: item.name, bold: true, fontSize: 10 },
          ...(item.description
            ? [{ text: item.description, fontSize: 8, color: theme.mutedColor }]
            : []),
        ],
        fillColor,
        margin: [10, 8, 5, 8],
      },
      {
        text: `${item.quantity} ${item.unit}`,
        fillColor,
        alignment: "center",
        margin: [5, 8, 5, 8],
        fontSize: 10,
      },
      {
        text: formatCurrency(item.unitPrice, currency, locale),
        fillColor,
        alignment: "right",
        margin: [5, 8, 5, 8],
        fontSize: 10,
      },
      {
        text: item.discountPercent ? `${item.discountPercent}%` : "-",
        fillColor,
        alignment: "center",
        margin: [5, 8, 5, 8],
        fontSize: 10,
      },
      {
        text: formatCurrency(item.amount, currency, locale),
        fillColor,
        alignment: "right",
        margin: [5, 8, 10, 8],
        fontSize: 10,
        bold: true,
      },
    ];
  });

  return {
    table: {
      headerRows: 1,
      widths: ["*", 60, 80, 50, 90],
      body: [headerRow, ...itemRows],
    },
    layout: {
      hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
        i === 0 || i === 1 || i === node.table.body.length ? 1 : 0,
      vLineWidth: () => 1,
      hLineColor: () => theme.borderColor,
      vLineColor: () => theme.borderColor,
    },
    margin: [0, 0, 0, 15],
  } as unknown as Content;
}

/**
 * Build totals section
 */
function buildTotals(
  data: PDFInvoiceData,
  currency = "USD",
  locale = "en-US"
): Content {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[][] = [];

  // Subtotal
  rows.push([
    { text: "" },
    { text: "" },
    { text: "Subtotal", alignment: "right", bold: true, margin: [0, 8, 10, 8] },
    {
      text: formatCurrency(data.subtotal, currency, locale),
      alignment: "right",
      margin: [0, 8, 10, 8],
    },
  ]);

  // Discount
  if (data.discountAmount > 0) {
    rows.push([
      { text: "" },
      { text: "" },
      {
        text: "Discount",
        alignment: "right",
        margin: [0, 8, 10, 8],
        fillColor: ALT_ROW_BG,
      },
      {
        text: `-${formatCurrency(data.discountAmount, currency, locale)}`,
        alignment: "right",
        margin: [0, 8, 10, 8],
        fillColor: ALT_ROW_BG,
        color: "#DC2626",
      },
    ]);
  }

  // Tax
  if (data.taxAmount > 0) {
    rows.push([
      { text: "" },
      { text: "" },
      { text: "Tax", alignment: "right", margin: [0, 8, 10, 8] },
      {
        text: formatCurrency(data.taxAmount, currency, locale),
        alignment: "right",
        margin: [0, 8, 10, 8],
      },
    ]);
  }

  // Total
  rows.push([
    { text: "" },
    { text: "" },
    {
      text: "Total",
      alignment: "right",
      bold: true,
      margin: [0, 10, 10, 10],
      fillColor: HEADER_BG,
      fontSize: 12,
    },
    {
      text: formatCurrency(data.total, currency, locale),
      alignment: "right",
      bold: true,
      margin: [0, 10, 10, 10],
      fillColor: HEADER_BG,
      fontSize: 12,
    },
  ]);

  // Amount Paid & Due
  if ((data.amountPaid ?? 0) > 0) {
    rows.push([
      { text: "" },
      { text: "" },
      {
        text: "Amount Paid",
        alignment: "right",
        margin: [0, 8, 10, 8],
        color: "#16A34A",
      },
      {
        text: formatCurrency(data.amountPaid ?? 0, currency, locale),
        alignment: "right",
        margin: [0, 8, 10, 8],
        color: "#16A34A",
      },
    ]);
  }

  if ((data.amountDue ?? 0) > 0) {
    rows.push([
      { text: "" },
      { text: "" },
      {
        text: "Balance Due",
        alignment: "right",
        bold: true,
        margin: [0, 8, 10, 8],
        color: "#DC2626",
      },
      {
        text: formatCurrency(data.amountDue ?? 0, currency, locale),
        alignment: "right",
        bold: true,
        margin: [0, 8, 10, 8],
        color: "#DC2626",
      },
    ]);
  }

  return {
    table: {
      widths: ["*", "*", 100, 100],
      body: rows,
    },
    layout: "noBorders",
    margin: [0, 0, 0, 15],
  } as Content;
}

/**
 * Build amount in words section
 */
function buildAmountInWords(total: number, currencyName = "Dollars"): Content {
  const words = numberToWords(total, currencyName, "Cents");

  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: [
              { text: "Amount in Words: ", bold: true, fontSize: 9 },
              { text: words, fontSize: 9, italics: true },
            ],
            fillColor: "#F8FAFC",
            margin: [10, 8, 10, 8],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => theme.borderColor,
      vLineColor: () => theme.borderColor,
    },
    margin: [0, 0, 0, 20],
  };
}

/**
 * Build footer with notes and signature
 */
function buildFooter(
  data: PDFInvoiceData,
  company: PDFCompanyInfo,
  options: PDFGenerationOptions
): Content {
  const leftStack: Content[] = [];
  const rightStack: Content[] = [];

  // Notes
  if (data.notes) {
    leftStack.push(
      {
        text: "Notes",
        fontSize: 10,
        bold: true,
        color: theme.mutedColor,
        margin: [0, 0, 0, 5],
      },
      { text: data.notes, fontSize: 9, color: theme.textColor }
    );
  }

  // Terms
  if (options.showTerms && data.terms) {
    leftStack.push(
      {
        text: "Terms & Conditions",
        fontSize: 10,
        bold: true,
        color: theme.mutedColor,
        margin: [0, 10, 0, 5],
      },
      { text: data.terms, fontSize: 8, color: theme.mutedColor }
    );
  }

  // Signature
  if (options.showSignature) {
    rightStack.push(
      { text: "", margin: [0, 30, 0, 0] },
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 150,
            y2: 0,
            lineWidth: 1,
            lineColor: theme.textColor,
          },
        ],
      },
      {
        text: "Authorized Signature",
        fontSize: 9,
        color: theme.mutedColor,
        margin: [0, 5, 0, 0],
      },
      { text: company.name, fontSize: 10, bold: true, margin: [0, 3, 0, 0] }
    );
  }

  return {
    columns: [
      { width: "60%", stack: leftStack },
      { width: "40%", stack: rightStack, alignment: "center" },
    ],
    margin: [0, 10, 0, 0],
  };
}

/**
 * Build the complete Modern template document
 */
export function buildModernDocument(
  data: PDFInvoiceData,
  companyInfo: PDFCompanyInfo,
  options: PDFGenerationOptions
): TDocumentDefinitions {
  const currencyName =
    options.currency === "PKR"
      ? "Rupees"
      : options.currency === "INR"
        ? "Rupees"
        : "Dollars";

  const content: Content[] = [
    buildModernHeader(companyInfo, data, options.showLogo),
    buildTitleBar(data),
    buildItemsTable(data.items, options.currency, options.locale),
    buildTotals(data, options.currency, options.locale),
    buildAmountInWords(data.total, currencyName),
    buildFooter(data, companyInfo, options),
  ];

  return {
    pageSize: options.paperSize as "A4" | "LETTER" | "LEGAL",
    pageMargins: [40, 40, 40, 40],
    content,
    styles: getStyles(),
    defaultStyle: {
      font: "Roboto",
      fontSize: FONT_SIZES.normal,
      color: theme.textColor,
    },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: "center" as const,
      fontSize: 8,
      color: theme.mutedColor,
      margin: [0, 10, 0, 0] as [number, number, number, number],
    }),
  };
}

function getStyles(): Record<string, Style> {
  return {
    header: { fontSize: 14, bold: true },
    subheader: { fontSize: 12, bold: true },
    tableHeader: { fontSize: 10, bold: true, fillColor: HEADER_BG },
  };
}
