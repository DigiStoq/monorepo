// ============================================================================
// CREDIT NOTE PDF BUILDER
// ============================================================================

import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type {
  PDFInvoiceData,
  PDFCompanyInfo,
  PDFGenerationOptions,
} from "../types";
import { buildBaseDocument } from "./base-builder";
import { PDF_THEME, FONT_SIZES } from "../constants";

/**
 * Build credit note specific info section
 */
function buildCreditNoteInfo(
  originalInvoiceNumber?: string,
  reason?: string
): Content {
  const rows: Content[][] = [];

  if (originalInvoiceNumber) {
    rows.push([
      {
        text: "Original Invoice:",
        fontSize: FONT_SIZES.small,
        bold: true,
        color: PDF_THEME.textColor,
      },
      {
        text: originalInvoiceNumber,
        fontSize: FONT_SIZES.small,
        color: PDF_THEME.textColor,
      },
    ]);
  }

  if (reason) {
    rows.push([
      {
        text: "Reason:",
        fontSize: FONT_SIZES.small,
        bold: true,
        color: PDF_THEME.textColor,
      },
      {
        text: reason,
        fontSize: FONT_SIZES.small,
        color: PDF_THEME.mutedColor,
      },
    ]);
  }

  if (rows.length === 0) {
    return { text: "" };
  }

  return {
    table: {
      widths: [100, "*"],
      body: rows,
    },
    layout: "noBorders",
    margin: [0, 0, 0, 15],
  };
}

/**
 * Build credit note notice
 */
function buildCreditNoteNotice(): Content {
  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: "This credit note reduces the amount owed by the customer. It should be applied against future invoices or refunded.",
            fontSize: FONT_SIZES.tiny,
            italics: true,
            color: PDF_THEME.mutedColor,
            alignment: "center",
            margin: [10, 8, 10, 8],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#e74c3c", // Red border for credit note
      vLineColor: () => "#e74c3c",
    },
    margin: [0, 10, 0, 0],
  };
}

/**
 * Build a credit note PDF document
 * Includes: original invoice reference, reason for credit
 */
export function buildCreditNoteDocument(
  data: PDFInvoiceData,
  companyInfo: PDFCompanyInfo,
  options: PDFGenerationOptions
): TDocumentDefinitions {
  // Remove payment fields for credit notes using destructuring
  const { amountPaid: _paid, amountDue: _due, ...rest } = data;

  // Ensure document type is set correctly
  const creditNoteData: PDFInvoiceData = {
    ...rest,
    documentType: "credit-note",
    partyLabel: "Bill To",
  };

  // Add credit note specific content
  const customContent: Content[] = [];

  // Add original invoice reference and reason
  const infoSection = buildCreditNoteInfo(
    data.originalInvoiceNumber,
    data.reason
  );
  if (infoSection) {
    customContent.push(infoSection);
  }

  // Add credit note notice
  customContent.push(buildCreditNoteNotice());

  return buildBaseDocument(creditNoteData, companyInfo, options, customContent);
}
