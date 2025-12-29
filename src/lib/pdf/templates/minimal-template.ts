// ============================================================================
// MINIMAL PDF TEMPLATE
// Simple, clean design with minimal styling
// ============================================================================

import type { Content, TDocumentDefinitions, Style } from "pdfmake/interfaces";
import type {
  PDFInvoiceData,
  PDFCompanyInfo,
  PDFGenerationOptions,
} from "../types";
import { TEMPLATE_THEMES, DOCUMENT_TITLES, FONT_SIZES, PDF_THEME } from "../constants";
import { formatCurrency, formatDate, formatAddress } from "../utils/format-helpers";
import { numberToWords } from "../utils/number-to-words";

const theme = TEMPLATE_THEMES.minimal ?? PDF_THEME;

/**
 * Build clean header with company and invoice info
 */
function buildMinimalHeader(
  company: PDFCompanyInfo,
  data: PDFInvoiceData,
  showLogo: boolean
): Content {
  const leftStack: Content[] = [];

  // Company name prominently
  if (showLogo && company.logoBase64) {
    leftStack.push({
      image: company.logoBase64,
      width: 100,
      margin: [0, 0, 0, 10],
    });
  }

  leftStack.push({
    text: company.name,
    fontSize: 20,
    bold: true,
    color: theme.primaryColor,
  });

  if (company.legalName && company.legalName !== company.name) {
    leftStack.push({
      text: company.legalName,
      fontSize: 10,
      color: theme.mutedColor,
      margin: [0, 2, 0, 0],
    });
  }

  // Company contact details
  const contactLines: string[] = [];
  if (company.address) {
    const addr = formatAddress(company.address);
    if (addr) contactLines.push(addr);
  }
  if (company.phone) contactLines.push(company.phone);
  if (company.email) contactLines.push(company.email);
  if (company.taxId) contactLines.push(`Tax ID: ${company.taxId}`);

  if (contactLines.length > 0) {
    leftStack.push({
      text: contactLines.join(" | "),
      fontSize: 9,
      color: theme.mutedColor,
      margin: [0, 8, 0, 0],
    });
  }

  // Document title and info on right
  const rightStack: Content[] = [
    {
      text: DOCUMENT_TITLES[data.documentType] || "DOCUMENT",
      fontSize: 28,
      bold: true,
      alignment: "right",
      color: theme.primaryColor,
    },
    {
      text: `#${data.documentNumber}`,
      fontSize: 12,
      alignment: "right",
      color: theme.mutedColor,
      margin: [0, 5, 0, 0],
    },
    {
      text: `Date: ${formatDate(data.date)}`,
      fontSize: 10,
      alignment: "right",
      color: theme.textColor,
      margin: [0, 10, 0, 0],
    },
  ];

  if (data.dueDate) {
    rightStack.push({
      text: `Due: ${formatDate(data.dueDate)}`,
      fontSize: 10,
      alignment: "right",
      color: theme.textColor,
    });
  }

  if (data.validUntil) {
    rightStack.push({
      text: `Valid Until: ${formatDate(data.validUntil)}`,
      fontSize: 10,
      alignment: "right",
      color: theme.textColor,
    });
  }

  return {
    columns: [
      { width: "55%", stack: leftStack },
      { width: "45%", stack: rightStack },
    ],
    margin: [0, 0, 0, 30],
  };
}

/**
 * Build billing info section
 */
function buildBillingSection(data: PDFInvoiceData): Content {
  const stack: Content[] = [
    {
      text: data.partyLabel,
      fontSize: 9,
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
    stack.push({
      text: data.partyInfo.address,
      fontSize: 10,
      color: theme.textColor,
      margin: [0, 3, 0, 0],
    });
  }

  const cityStateZip = [
    data.partyInfo.city,
    data.partyInfo.state,
    data.partyInfo.zipCode,
  ].filter(Boolean).join(", ");

  if (cityStateZip) {
    stack.push({
      text: cityStateZip,
      fontSize: 10,
      color: theme.textColor,
    });
  }

  if (data.partyInfo.phone) {
    stack.push({
      text: data.partyInfo.phone,
      fontSize: 10,
      color: theme.mutedColor,
      margin: [0, 5, 0, 0],
    });
  }

  if (data.partyInfo.email) {
    stack.push({
      text: data.partyInfo.email,
      fontSize: 10,
      color: theme.mutedColor,
    });
  }

  return {
    stack,
    margin: [0, 0, 0, 25],
  };
}

/**
 * Build clean items table
 */
function buildItemsTable(
  items: PDFInvoiceData["items"],
  currency = "USD",
  locale = "en-US"
): Content {
  const headerRow = [
    { text: "#", bold: true, fontSize: 9, color: theme.mutedColor },
    { text: "Description", bold: true, fontSize: 9, color: theme.mutedColor },
    { text: "Qty", bold: true, fontSize: 9, color: theme.mutedColor, alignment: "center" },
    { text: "Rate", bold: true, fontSize: 9, color: theme.mutedColor, alignment: "right" },
    { text: "Amount", bold: true, fontSize: 9, color: theme.mutedColor, alignment: "right" },
  ];

  const itemRows = items.map((item) => [
    { text: item.index.toString(), fontSize: 10, color: theme.mutedColor },
    {
      stack: [
        { text: item.name, fontSize: 10, bold: true },
        ...(item.description ? [{ text: item.description, fontSize: 9, color: theme.mutedColor }] : []),
      ],
    },
    { text: `${item.quantity} ${item.unit}`, fontSize: 10, alignment: "center" },
    { text: formatCurrency(item.unitPrice, currency, locale), fontSize: 10, alignment: "right" },
    { text: formatCurrency(item.amount, currency, locale), fontSize: 10, alignment: "right", bold: true },
  ]);

  return {
    table: {
      headerRows: 1,
      widths: [25, "*", 60, 70, 80],
      body: [headerRow, ...itemRows],
    },
    layout: {
      hLineWidth: (i: number, node: { table: { body: unknown[] } }) => (i === 1 || i === node.table.body.length) ? 0.5 : 0,
      vLineWidth: () => 0,
      hLineColor: () => theme.borderColor,
      paddingTop: () => 10,
      paddingBottom: () => 10,
    },
    margin: [0, 0, 0, 20],
  } as unknown as Content;
}

/**
 * Build totals with clean lines
 */
function buildTotals(
  data: PDFInvoiceData,
  currency = "USD",
  locale = "en-US"
): Content {
  const rows: { label: string; value: string; bold?: boolean; color?: string }[] = [];

  rows.push({ label: "Subtotal", value: formatCurrency(data.subtotal, currency, locale) });

  if (data.discountAmount > 0) {
    rows.push({ label: "Discount", value: `-${formatCurrency(data.discountAmount, currency, locale)}`, color: "#DC2626" });
  }

  if (data.taxAmount > 0) {
    rows.push({ label: "Tax", value: formatCurrency(data.taxAmount, currency, locale) });
  }

  rows.push({ label: "Total", value: formatCurrency(data.total, currency, locale), bold: true });

  if (data.amountPaid !== undefined && data.amountPaid > 0) {
    rows.push({ label: "Paid", value: formatCurrency(data.amountPaid, currency, locale), color: "#16A34A" });
  }

  if (data.amountDue !== undefined && data.amountDue > 0) {
    rows.push({ label: "Balance Due", value: formatCurrency(data.amountDue, currency, locale), bold: true, color: "#DC2626" });
  }

  return {
    columns: [
      { width: "*", text: "" },
      {
        width: 200,
        table: {
          widths: ["*", "auto"],
          body: rows.map(row => [
            { text: row.label, fontSize: 10, bold: row.bold, alignment: "right", margin: [0, 5, 10, 5] },
            { text: row.value, fontSize: 10, bold: row.bold, alignment: "right", margin: [0, 5, 0, 5], color: row.color },
          ]),
        },
        layout: {
          hLineWidth: (i: number) => {
            // Line before "Total" row
            const totalRowIndex = rows.findIndex(r => r.label === "Total");
            return i === totalRowIndex ? 0.5 : 0;
          },
          vLineWidth: () => 0,
          hLineColor: () => theme.borderColor,
        },
      },
    ],
    margin: [0, 0, 0, 20],
  };
}

/**
 * Build amount in words
 */
function buildAmountInWords(total: number, currencyName = "Dollars"): Content {
  const words = numberToWords(total, currencyName, "Cents");

  return {
    text: [
      { text: "Amount in words: ", fontSize: 9, italics: true, color: theme.mutedColor },
      { text: words, fontSize: 9, italics: true, color: theme.textColor },
    ],
    margin: [0, 0, 0, 25],
  };
}

/**
 * Build footer section
 */
function buildFooter(
  data: PDFInvoiceData,
  _company: PDFCompanyInfo,
  options: PDFGenerationOptions
): Content {
  const content: Content[] = [];

  // Notes
  if (data.notes) {
    content.push({
      stack: [
        { text: "Notes", fontSize: 9, bold: true, color: theme.mutedColor, margin: [0, 0, 0, 5] },
        { text: data.notes, fontSize: 9, color: theme.textColor },
      ],
      margin: [0, 0, 0, 15],
    });
  }

  // Terms
  if (options.showTerms && data.terms) {
    content.push({
      stack: [
        { text: "Terms & Conditions", fontSize: 9, bold: true, color: theme.mutedColor, margin: [0, 0, 0, 5] },
        { text: data.terms, fontSize: 8, color: theme.mutedColor },
      ],
      margin: [0, 0, 0, 15],
    });
  }

  // Signature line
  if (options.showSignature) {
    content.push({
      columns: [
        { width: "*", text: "" },
        {
          width: 180,
          stack: [
            { text: "", margin: [0, 20, 0, 0] },
            { canvas: [{ type: "line", x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.5, lineColor: theme.textColor }] },
            { text: "Authorized Signature", fontSize: 8, color: theme.mutedColor, alignment: "center", margin: [0, 5, 0, 0] },
          ],
        },
      ],
    });
  }

  // Thank you note
  content.push({
    text: "Thank you for your business!",
    fontSize: 10,
    italics: true,
    color: theme.mutedColor,
    alignment: "center",
    margin: [0, 25, 0, 0],
  });

  return { stack: content };
}

/**
 * Build the complete Minimal template document
 */
export function buildMinimalDocument(
  data: PDFInvoiceData,
  companyInfo: PDFCompanyInfo,
  options: PDFGenerationOptions
): TDocumentDefinitions {
  const currencyName = options.currency === "PKR" ? "Rupees" : options.currency === "INR" ? "Rupees" : "Dollars";

  const content: Content[] = [
    buildMinimalHeader(companyInfo, data, options.showLogo),
    buildBillingSection(data),
    buildItemsTable(data.items, options.currency, options.locale),
    buildTotals(data, options.currency, options.locale),
    buildAmountInWords(data.total, currencyName),
    buildFooter(data, companyInfo, options),
  ];

  return {
    pageSize: options.paperSize as "A4" | "LETTER" | "LEGAL",
    pageMargins: [50, 50, 50, 50],
    content,
    styles: getStyles(),
    defaultStyle: {
      font: "Roboto",
      fontSize: FONT_SIZES.normal,
      color: theme.textColor,
    },
    footer: (currentPage: number, pageCount: number) => ({
      text: `${currentPage} / ${pageCount}`,
      alignment: "center" as const,
      fontSize: 8,
      color: theme.mutedColor,
      margin: [0, 10, 0, 0] as [number, number, number, number],
    }),
  };
}

function getStyles(): Record<string, Style> {
  return {
    header: { fontSize: 20, bold: true },
    subheader: { fontSize: 12, bold: true },
  };
}
