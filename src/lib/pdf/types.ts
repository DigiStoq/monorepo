// ============================================================================
// PDF GENERATION TYPES
// ============================================================================

import type { Content, Style, TDocumentDefinitions } from "pdfmake/interfaces";

// Document types supported for PDF generation
export type PDFDocumentType =
  | "sale-invoice"
  | "estimate"
  | "purchase-invoice"
  | "credit-note";

// PDF template styles
export type PDFTemplateId = "classic" | "modern" | "minimal";

export interface PDFTemplateInfo {
  id: PDFTemplateId;
  name: string;
  description: string;
  preview?: string; // Preview image URL or base64
}

// Company information for PDF header
export interface PDFCompanyInfo {
  name: string;
  legalName?: string;
  logoBase64?: string; // Base64 encoded logo image (data:image/png;base64,...)
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  taxId?: string;
}

// Customer/Supplier information for "Bill To" section
export interface PDFPartyInfo {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxId?: string;
}

// Line item for PDF table
export interface PDFLineItem {
  index: number;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  amount: number;
}

// Common invoice data for PDF
export interface PDFInvoiceData {
  documentType: PDFDocumentType;
  documentNumber: string;
  date: string;
  dueDate?: string;
  validUntil?: string; // For estimates

  // Party info
  partyInfo: PDFPartyInfo;
  partyLabel: "Bill To" | "Supplier";

  // Items
  items: PDFLineItem[];

  // Amounts
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid?: number;
  amountDue?: number;

  // Additional
  notes?: string;
  terms?: string;

  // For credit notes
  originalInvoiceNumber?: string;
  reason?: string;
}

// PDF generation options
export interface PDFGenerationOptions {
  paperSize: "A4" | "Letter" | "Legal";
  template: PDFTemplateId;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showLogo: boolean;
  showSignature: boolean;
  showTerms: boolean;
  showBankDetails: boolean;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingNumber?: string;
    branchName?: string;
    swiftCode?: string;
  };
  currency?: string;
  locale?: string;
}

// PDF style configuration
export interface PDFTheme {
  primaryColor: string;
  headerBgColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
}

// Re-export pdfmake types for convenience
export type { Content, Style, TDocumentDefinitions };
