// ============================================================================
// PDF GENERATION CONSTANTS
// ============================================================================

import type { PDFTheme, PDFGenerationOptions, PDFTemplateInfo } from "./types";

// Med_rep inspired purple theme
export const PDF_THEME: PDFTheme = {
  primaryColor: "#847DE6", // Purple from Med_rep
  headerBgColor: "#847DE6",
  borderColor: "#847DE6",
  textColor: "#1e293b", // slate-800
  mutedColor: "#64748b", // slate-500
};

// Light purple for alternating rows
export const LIGHT_PURPLE = "#F4F0FF";

// Default page sizes in points (72 points = 1 inch)
export const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
} as const;

// Default margins in points
export const DEFAULT_MARGINS = {
  top: 40,
  right: 40,
  bottom: 40,
  left: 40,
};

// Document titles by type
export const DOCUMENT_TITLES: Record<string, string> = {
  "sale-invoice": "INVOICE",
  estimate: "ESTIMATE / QUOTATION",
  "purchase-invoice": "PURCHASE INVOICE",
  "credit-note": "CREDIT NOTE",
};

// Table column widths
export const ITEMS_TABLE_WIDTHS = [25, "*", 50, 60, 40, 70];

// Default PDF generation options
export const DEFAULT_PDF_OPTIONS: PDFGenerationOptions = {
  paperSize: "A4",
  template: "classic",
  margins: DEFAULT_MARGINS,
  showLogo: true,
  showSignature: true,
  showTerms: true,
  showBankDetails: false,
  currency: "USD",
  locale: "en-US",
};

// Font sizes
export const FONT_SIZES = {
  title: 18,
  documentTitle: 16,
  header: 12,
  sectionHeader: 11,
  normal: 10,
  small: 9,
  tiny: 8,
};

// ============================================================================
// PDF TEMPLATES
// ============================================================================

// Available PDF templates
export const PDF_TEMPLATES: PDFTemplateInfo[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Professional purple theme with bordered layout",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean blue-gray design with sidebar layout",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple, clean design with minimal styling",
  },
];

// Template-specific themes
export const TEMPLATE_THEMES: Record<string, PDFTheme> = {
  classic: {
    primaryColor: "#847DE6",
    headerBgColor: "#847DE6",
    borderColor: "#847DE6",
    textColor: "#1e293b",
    mutedColor: "#64748b",
  },
  modern: {
    primaryColor: "#3B82F6",
    headerBgColor: "#D8E0EF",
    borderColor: "#E5E5E5",
    textColor: "#333333",
    mutedColor: "#aaaaab",
  },
  minimal: {
    primaryColor: "#0F172A",
    headerBgColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    textColor: "#1e293b",
    mutedColor: "#64748b",
  },
};
