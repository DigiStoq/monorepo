// ============================================================================
// SALE INVOICE PDF BUILDER
// ============================================================================

import type { TDocumentDefinitions } from "pdfmake/interfaces";
import type {
  PDFInvoiceData,
  PDFCompanyInfo,
  PDFGenerationOptions,
} from "../types";
import { buildBaseDocument } from "./base-builder";

/**
 * Build a sale invoice PDF document
 * Includes: paid amount, balance due
 */
export function buildSaleInvoiceDocument(
  data: PDFInvoiceData,
  companyInfo: PDFCompanyInfo,
  options: PDFGenerationOptions
): TDocumentDefinitions {
  // Ensure document type is set correctly
  const invoiceData: PDFInvoiceData = {
    ...data,
    documentType: "sale-invoice",
    partyLabel: "Bill To",
  };

  // Use base builder - sale invoice uses standard layout
  return buildBaseDocument(invoiceData, companyInfo, options);
}
