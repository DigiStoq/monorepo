// ============================================================================
// PDF GENERATION LIBRARY
// ============================================================================

// Main generator class
export { PDFGenerator, createPDFGenerator } from "./pdf-generator";

// Types
export type {
  PDFDocumentType,
  PDFTemplateId,
  PDFTemplateInfo,
  PDFCompanyInfo,
  PDFPartyInfo,
  PDFLineItem,
  PDFInvoiceData,
  PDFGenerationOptions,
  PDFTheme,
} from "./types";

// Constants
export {
  PDF_THEME,
  LIGHT_PURPLE,
  PAGE_SIZES,
  DEFAULT_MARGINS,
  DOCUMENT_TITLES,
  DEFAULT_PDF_OPTIONS,
  FONT_SIZES,
  PDF_TEMPLATES,
  TEMPLATE_THEMES,
} from "./constants";

// Document builders (for advanced use)
export {
  buildBaseDocument,
  buildSaleInvoiceDocument,
  buildEstimateDocument,
  buildPurchaseInvoiceDocument,
  buildCreditNoteDocument,
} from "./document-builders";

// Template builders
export { buildModernDocument, buildMinimalDocument } from "./templates";

// Utility functions
export {
  numberToWords,
  numberToWordsPKR,
  numberToWordsINR,
  numberToWordsUSD,
} from "./utils/number-to-words";

export {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatPhone,
  formatNumber,
  formatPercent,
  formatAddress,
  truncateText,
} from "./utils/format-helpers";

// Components (for custom document building)
export { buildHeader } from "./components/header";
export { buildItemsTable } from "./components/items-table";
export { buildAmounts, buildAmountsWithBorder } from "./components/amounts";
export {
  buildAmountInWords,
  buildAmountInWordsSimple,
} from "./components/amount-in-words";
export {
  buildTerms,
  buildSignature,
  buildBankDetails,
  buildTermsAndSignature,
} from "./components/terms-signature";
