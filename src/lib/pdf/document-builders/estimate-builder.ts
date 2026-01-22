// ============================================================================
// ESTIMATE/QUOTATION PDF BUILDER
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
 * Build estimate-specific content
 */
function buildEstimateNotice(): Content {
  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: "This is a quotation/estimate and not a final invoice. Prices and availability are subject to change.",
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
      hLineColor: () => PDF_THEME.borderColor,
      vLineColor: () => PDF_THEME.borderColor,
      hLineStyle: () => ({ dash: { length: 3, space: 2 } }),
      vLineStyle: () => ({ dash: { length: 3, space: 2 } }),
    },
    margin: [0, 10, 0, 0],
  };
}

/**
 * Build an estimate/quotation PDF document
 * Includes: valid until date, estimate notice
 */
export function buildEstimateDocument(
  data: PDFInvoiceData,
  companyInfo: PDFCompanyInfo,
  options: PDFGenerationOptions
): TDocumentDefinitions {
  // Create a copy without payment fields for estimates
  const { amountPaid: _paid, amountDue: _due, ...rest } = data;

  // Ensure document type is set correctly
  const estimateData: PDFInvoiceData = {
    ...rest,
    documentType: "estimate",
    partyLabel: "Bill To",
  };

  // Add estimate-specific notice
  const customContent: Content[] = [buildEstimateNotice()];

  return buildBaseDocument(estimateData, companyInfo, options, customContent);
}
