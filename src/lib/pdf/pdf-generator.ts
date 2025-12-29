// ============================================================================
// PDF GENERATOR CLASS
// ============================================================================

import pdfMake from "pdfmake/build/pdfmake";
import type { TDocumentDefinitions, TFontDictionary } from "pdfmake/interfaces";
import type {
  PDFInvoiceData,
  PDFCompanyInfo,
  PDFGenerationOptions,
} from "./types";
import { DEFAULT_PDF_OPTIONS } from "./constants";
import {
  buildSaleInvoiceDocument,
  buildEstimateDocument,
  buildPurchaseInvoiceDocument,
  buildCreditNoteDocument,
} from "./document-builders";
import { buildModernDocument, buildMinimalDocument } from "./templates";

// Initialize pdfmake with virtual file system fonts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(async () => {
  try {
    const pdfFonts = await import("pdfmake/build/vfs_fonts");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfMake.vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).default?.pdfMake?.vfs ?? pdfFonts;
  } catch (e) {
    console.warn("Failed to load pdfmake fonts:", e);
  }
})();

// Define fonts - pdfmake uses Roboto by default
const fonts: TFontDictionary = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

/**
 * PDF Generator class for creating invoice and document PDFs
 */
export class PDFGenerator {
  private companyInfo: PDFCompanyInfo;
  private options: PDFGenerationOptions;

  constructor(
    companyInfo: PDFCompanyInfo,
    options?: Partial<PDFGenerationOptions>
  ) {
    this.companyInfo = companyInfo;
    this.options = { ...DEFAULT_PDF_OPTIONS, ...options };
  }

  /**
   * Generate a document definition based on document type and selected template
   */
  generateDocument(data: PDFInvoiceData): TDocumentDefinitions {
    const template = this.options.template || "classic";

    // For modern and minimal templates, use the unified template builders
    if (template === "modern") {
      return buildModernDocument(data, this.companyInfo, this.options);
    }

    if (template === "minimal") {
      return buildMinimalDocument(data, this.companyInfo, this.options);
    }

    // Classic template uses the original document-type specific builders
    switch (data.documentType) {
      case "sale-invoice":
        return buildSaleInvoiceDocument(data, this.companyInfo, this.options);
      case "estimate":
        return buildEstimateDocument(data, this.companyInfo, this.options);
      case "purchase-invoice":
        return buildPurchaseInvoiceDocument(data, this.companyInfo, this.options);
      case "credit-note":
        return buildCreditNoteDocument(data, this.companyInfo, this.options);
      default:
        throw new Error(`Unknown document type: ${data.documentType}`);
    }
  }

  /**
   * Download PDF to user's device
   */
  download(data: PDFInvoiceData, filename?: string): void {
    const docDefinition = this.generateDocument(data);
    const defaultFilename = `${data.documentNumber}.pdf`;
    pdfMake.createPdf(docDefinition, undefined, fonts).download(filename ?? defaultFilename);
  }

  /**
   * Open PDF in new browser tab
   */
  open(data: PDFInvoiceData): void {
    const docDefinition = this.generateDocument(data);
    pdfMake.createPdf(docDefinition, undefined, fonts).open();
  }

  /**
   * Print PDF directly
   */
  print(data: PDFInvoiceData): void {
    const docDefinition = this.generateDocument(data);
    pdfMake.createPdf(docDefinition, undefined, fonts).print();
  }

  /**
   * Get PDF as Blob
   */
  async getBlob(data: PDFInvoiceData): Promise<Blob> {
    const docDefinition = this.generateDocument(data);
    return new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition, undefined, fonts).getBlob(resolve);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get PDF as Base64 string
   */
  async getBase64(data: PDFInvoiceData): Promise<string> {
    const docDefinition = this.generateDocument(data);
    return new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition, undefined, fonts).getBase64(resolve);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get PDF as data URL (for embedding in img tags or iframes)
   */
  async getDataUrl(data: PDFInvoiceData): Promise<string> {
    const docDefinition = this.generateDocument(data);
    return new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition, undefined, fonts).getDataUrl(resolve);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get PDF as Buffer (for server-side use)
   */
  async getBuffer(data: PDFInvoiceData): Promise<Buffer> {
    const docDefinition = this.generateDocument(data);
    return new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition, undefined, fonts).getBuffer(resolve);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Update company info
   */
  setCompanyInfo(companyInfo: PDFCompanyInfo): void {
    this.companyInfo = companyInfo;
  }

  /**
   * Update options
   */
  setOptions(options: Partial<PDFGenerationOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current company info
   */
  getCompanyInfo(): PDFCompanyInfo {
    return this.companyInfo;
  }

  /**
   * Get current options
   */
  getOptions(): PDFGenerationOptions {
    return this.options;
  }
}

/**
 * Create a new PDF generator instance
 */
export function createPDFGenerator(
  companyInfo: PDFCompanyInfo,
  options?: Partial<PDFGenerationOptions>
): PDFGenerator {
  return new PDFGenerator(companyInfo, options);
}
