// ============================================================================
// PURCHASE INVOICE PDF BUILDER
// ============================================================================

import type { TDocumentDefinitions } from "pdfmake/interfaces";
import type {
  PDFInvoiceData,
  PDFCompanyInfo,
  PDFGenerationOptions,
} from "../types";
import { buildBaseDocument } from "./base-builder";

/**
 * Build a purchase invoice PDF document
 * Shows supplier info instead of customer (Bill To)
 */
export function buildPurchaseInvoiceDocument(
  data: PDFInvoiceData,
  companyInfo: PDFCompanyInfo,
  options: PDFGenerationOptions
): TDocumentDefinitions {
  // Ensure document type is set correctly
  const purchaseData: PDFInvoiceData = {
    ...data,
    documentType: "purchase-invoice",
    partyLabel: "Supplier", // Use "Supplier" instead of "Bill To"
  };

  // Use base builder - purchase invoice uses standard layout with different label
  return buildBaseDocument(purchaseData, companyInfo, options);
}
