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

// Tauri imports
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-shell";
import { tempDir } from "@tauri-apps/api/path";
import { join } from "@tauri-apps/api/path";

// Initialize pdfmake with virtual file system fonts
void (async () => {
  try {
    const pdfFonts = await import("pdfmake/build/vfs_fonts");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vfs = pdfFonts as any;
    pdfMake.vfs = vfs.pdfMake?.vfs ?? vfs.default?.pdfMake?.vfs ?? pdfFonts;
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
 * Check if running in Tauri environment
 */
const isTauri = (): boolean => {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
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
    const template = this.options.template;

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
        return buildPurchaseInvoiceDocument(
          data,
          this.companyInfo,
          this.options
        );
      case "credit-note":
        return buildCreditNoteDocument(data, this.companyInfo, this.options);
      default:
        throw new Error(
          `Unknown document type: ${data.documentType as string}`
        );
    }
  }

  /**
   * Download PDF to user's device
   */
  async download(data: PDFInvoiceData, filename?: string): Promise<void> {
    const defaultFilename = `${data.documentNumber}.pdf`;
    const finalFilename = filename ?? defaultFilename;

    if (isTauri()) {
      try {
        // 1. Generate PDF buffer
        const buffer = await this.getBuffer(data);

        // 2. Open Save Dialog
        const filePath = await save({
          defaultPath: finalFilename,
          filters: [
            {
              name: "PDF Files",
              extensions: ["pdf"],
            },
          ],
        });

        if (!filePath) return; // User cancelled

        // 3. Write file
        // Convert Buffer to Uint8Array for Tauri fs
        const uint8Array = new Uint8Array(buffer);
        await writeFile(filePath, uint8Array);
      } catch (err) {
        console.error("Failed to save PDF in desktop mode:", err);
        // Fallback to browser download if something fails
        this.downloadBrowser(data, finalFilename);
      }
    } else {
      this.downloadBrowser(data, finalFilename);
    }
  }

  private downloadBrowser(data: PDFInvoiceData, filename: string): void {
    const docDefinition = this.generateDocument(data);
    pdfMake.createPdf(docDefinition, undefined, fonts).download(filename);
  }

  /**
   * Open PDF in new browser tab or system viewer
   */
  async open(data: PDFInvoiceData): Promise<void> {
    if (isTauri()) {
      await this.print(data);
    } else {
      const docDefinition = this.generateDocument(data);
      pdfMake.createPdf(docDefinition, undefined, fonts).open();
    }
  }

  /**
   * Print PDF directly
   */
  async print(data: PDFInvoiceData): Promise<void> {
    if (isTauri()) {
      try {
        // 1. Generate PDF buffer
        const buffer = await this.getBuffer(data);

        // 2. Save to temp location
        const tempDirPath = await tempDir();
        const filename = `document-${Date.now()}.pdf`;

        const uint8Array = new Uint8Array(buffer);
        // Use full path for writing if we can resolve it, or BaseDirectory.Temp?
        // writeBinaryFile with BaseDirectory.Temp is relative to temp.
        // shell.open needs absolute path.
        // Best approach:

        // Resolve path manually
        const fullPath = await join(tempDirPath, filename);

        // Write using absolute path (BaseDirectory not needed if path is absolute)
        // Note: writeFile(path, contents, options?)
        await writeFile(fullPath, uint8Array);

        // 3. Open with system viewer
        await open(fullPath);
      } catch (err) {
        console.error("Failed to print PDF in desktop mode:", err);
        // Fallback
        const docDefinition = this.generateDocument(data);
        pdfMake.createPdf(docDefinition, undefined, fonts).print();
      }
    } else {
      const docDefinition = this.generateDocument(data);
      pdfMake.createPdf(docDefinition, undefined, fonts).print();
    }
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
        reject(error instanceof Error ? error : new Error(String(error)));
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
        reject(error instanceof Error ? error : new Error(String(error)));
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
        reject(error instanceof Error ? error : new Error(String(error)));
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
        reject(error instanceof Error ? error : new Error(String(error)));
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
