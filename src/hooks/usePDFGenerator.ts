// ============================================================================
// PDF GENERATOR HOOK
// ============================================================================

import { useCallback, useMemo } from "react";
import {
  PDFGenerator,
  type PDFCompanyInfo,
  type PDFGenerationOptions,
  type PDFLineItem,
  type PDFPartyInfo,
  type PDFTemplateId,
  type PDFInvoiceData,
} from "@/lib/pdf";
import { useCompanySettings, useInvoiceSettings } from "./useSettings";
import type { SaleInvoice, Estimate, CreditNote } from "@/features/sales/types";
import type { PurchaseInvoice } from "@/features/purchases/types";
import type { Customer } from "@/features/customers/types";

// ============================================================================
// INTERNAL TYPES (match what useSettings actually returns - flat structure)
// ============================================================================

interface FlatCompanySettings {
  id: string;
  name: string;
  legalName?: string;
  logoUrl?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWebsite?: string;
  taxId?: string;
  ein?: string;
  financialYearStartMonth: number;
  financialYearStartDay: number;
  currency: string;
  locale: string;
  timezone: string;
}

interface FlatInvoiceSettings {
  id?: string;
  prefix: string;
  nextNumber: number;
  padding: number;
  termsAndConditions?: string;
  notes?: string;
  showPaymentQr?: boolean;
  showBankDetails: boolean;
  dueDateDays: number;
  lateFeesEnabled: boolean;
  lateFeesPercentage?: number;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankRoutingNumber?: string;
  bankBranchName?: string;
  bankSwiftCode?: string;
  pdfTemplate?: PDFTemplateId;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert a customer to PDF party info
 */
function customerToPartyInfo(
  name: string,
  customer?: Customer | null
): PDFPartyInfo {
  const info: PDFPartyInfo = { name };
  if (customer?.phone) info.phone = customer.phone;
  if (customer?.email) info.email = customer.email;
  if (customer?.address) info.address = customer.address;
  if (customer?.city) info.city = customer.city;
  if (customer?.state) info.state = customer.state;
  if (customer?.zipCode) info.zipCode = customer.zipCode;
  if (customer?.taxId) info.taxId = customer.taxId;
  return info;
}

/**
 * Convert invoice items to PDF line items
 */
function itemsToPDFLineItems(
  items: Array<{
    itemName: string;
    description?: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    discountPercent?: number;
    taxPercent?: number;
    amount: number;
  }>
): PDFLineItem[] {
  return items.map((item, idx) => {
    const lineItem: PDFLineItem = {
      index: idx + 1,
      name: item.itemName,
      quantity: item.quantity,
      unit: item.unit ?? "pcs",
      unitPrice: item.unitPrice,
      amount: item.amount,
    };
    if (item.description) lineItem.description = item.description;
    if (item.discountPercent !== undefined) lineItem.discountPercent = item.discountPercent;
    if (item.taxPercent !== undefined) lineItem.taxPercent = item.taxPercent;
    return lineItem;
  });
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export interface UsePDFGeneratorReturn {
  // Sale Invoice methods
  downloadSaleInvoice: (invoice: SaleInvoice, customer?: Customer | null) => void;
  printSaleInvoice: (invoice: SaleInvoice, customer?: Customer | null) => void;
  openSaleInvoice: (invoice: SaleInvoice, customer?: Customer | null) => void;

  // Estimate methods
  downloadEstimate: (estimate: Estimate, customer?: Customer | null) => void;
  printEstimate: (estimate: Estimate, customer?: Customer | null) => void;
  openEstimate: (estimate: Estimate, customer?: Customer | null) => void;

  // Purchase Invoice methods
  downloadPurchaseInvoice: (invoice: PurchaseInvoice, supplier?: Customer | null) => void;
  printPurchaseInvoice: (invoice: PurchaseInvoice, supplier?: Customer | null) => void;
  openPurchaseInvoice: (invoice: PurchaseInvoice, supplier?: Customer | null) => void;

  // Credit Note methods
  downloadCreditNote: (note: CreditNote, customer?: Customer | null) => void;
  printCreditNote: (note: CreditNote, customer?: Customer | null) => void;
  openCreditNote: (note: CreditNote, customer?: Customer | null) => void;

  // State
  isReady: boolean;
}

export function usePDFGenerator(): UsePDFGeneratorReturn {
  // Fetch settings from PowerSync database
  const { settings: rawCompanySettings } = useCompanySettings();
  const { settings: rawInvoiceSettings } = useInvoiceSettings();

  // Cast to flat types (the actual shape returned by hooks)
  const companySettings = rawCompanySettings as unknown as FlatCompanySettings | null;
  const invoiceSettings = rawInvoiceSettings as unknown as FlatInvoiceSettings | null;

  // Build company info for PDF (with fallback for when settings aren't configured)
  const companyInfo = useMemo((): PDFCompanyInfo => {
    // Default fallback when company settings aren't configured
    if (!companySettings) {
      return {
        name: "Your Company Name",
        // You can configure your company in Settings → Company Settings
      };
    }

    const info: PDFCompanyInfo = {
      name: companySettings.name,
    };

    if (companySettings.legalName) info.legalName = companySettings.legalName;
    if (companySettings.contactPhone) info.phone = companySettings.contactPhone;
    if (companySettings.contactEmail) info.email = companySettings.contactEmail;
    if (companySettings.taxId) info.taxId = companySettings.taxId;

    // Build address if any fields exist
    if (
      companySettings.addressStreet ||
      companySettings.addressCity ||
      companySettings.addressState ||
      companySettings.addressPostalCode ||
      companySettings.addressCountry
    ) {
      info.address = {};
      if (companySettings.addressStreet) info.address.street = companySettings.addressStreet;
      if (companySettings.addressCity) info.address.city = companySettings.addressCity;
      if (companySettings.addressState) info.address.state = companySettings.addressState;
      if (companySettings.addressPostalCode) info.address.postalCode = companySettings.addressPostalCode;
      if (companySettings.addressCountry) info.address.country = companySettings.addressCountry;
    }

    return info;
  }, [companySettings]);

  // Get template from invoice settings (with fallback)
  const template: PDFTemplateId = invoiceSettings?.pdfTemplate ?? "classic";

  // Build PDF options from settings
  const pdfOptions = useMemo((): PDFGenerationOptions => {
    return {
      paperSize: "A4",
      template,
      showLogo: true,
      showSignature: true,
      showTerms: true,
      showBankDetails: invoiceSettings?.showBankDetails ?? false,
      currency: companySettings?.currency ?? "USD",
      locale: companySettings?.locale ?? "en-US",
    };
  }, [template, invoiceSettings?.showBankDetails, companySettings?.currency, companySettings?.locale]);

  // Create PDF generator instance (always available with fallback company info)
  const generator = useMemo(() => {
    return new PDFGenerator(companyInfo, pdfOptions);
  }, [companyInfo, pdfOptions]);

  // ============================================================================
  // SALE INVOICE METHODS
  // ============================================================================

  const prepareSaleInvoiceData = useCallback(
    (invoice: SaleInvoice, customer?: Customer | null): PDFInvoiceData => {
      const data: PDFInvoiceData = {
        documentType: "sale-invoice",
        documentNumber: invoice.invoiceNumber,
        date: invoice.date,
        partyLabel: "Bill To",
        partyInfo: customerToPartyInfo(invoice.customerName, customer),
        items: itemsToPDFLineItems(invoice.items),
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        discountAmount: invoice.discountAmount,
        total: invoice.total,
      };

      if (invoice.dueDate) data.dueDate = invoice.dueDate;
      if (invoice.amountPaid !== undefined) data.amountPaid = invoice.amountPaid;
      if (invoice.amountDue !== undefined) data.amountDue = invoice.amountDue;
      if (invoice.notes) data.notes = invoice.notes;
      if (invoice.terms) data.terms = invoice.terms;

      return data;
    },
    []
  );

  const downloadSaleInvoice = useCallback(
    (invoice: SaleInvoice, customer?: Customer | null) => {
      const data = prepareSaleInvoiceData(invoice, customer);
      generator.download(data, `${invoice.invoiceNumber}.pdf`);
    },
    [generator, prepareSaleInvoiceData]
  );

  const printSaleInvoice = useCallback(
    (invoice: SaleInvoice, customer?: Customer | null) => {
      const data = prepareSaleInvoiceData(invoice, customer);
      generator.print(data);
    },
    [generator, prepareSaleInvoiceData]
  );

  const openSaleInvoice = useCallback(
    (invoice: SaleInvoice, customer?: Customer | null) => {
      const data = prepareSaleInvoiceData(invoice, customer);
      generator.open(data);
    },
    [generator, prepareSaleInvoiceData]
  );

  // ============================================================================
  // ESTIMATE METHODS
  // ============================================================================

  const prepareEstimateData = useCallback(
    (estimate: Estimate, customer?: Customer | null): PDFInvoiceData => {
      const data: PDFInvoiceData = {
        documentType: "estimate",
        documentNumber: estimate.estimateNumber,
        date: estimate.date,
        partyLabel: "Bill To",
        partyInfo: customerToPartyInfo(estimate.customerName, customer),
        items: itemsToPDFLineItems(estimate.items),
        subtotal: estimate.subtotal,
        taxAmount: estimate.taxAmount,
        discountAmount: estimate.discountAmount,
        total: estimate.total,
      };

      if (estimate.validUntil) data.validUntil = estimate.validUntil;
      if (estimate.notes) data.notes = estimate.notes;
      if (estimate.terms) data.terms = estimate.terms;

      return data;
    },
    []
  );

  const downloadEstimate = useCallback(
    (estimate: Estimate, customer?: Customer | null) => {
      const data = prepareEstimateData(estimate, customer);
      generator.download(data, `${estimate.estimateNumber}.pdf`);
    },
    [generator, prepareEstimateData]
  );

  const printEstimate = useCallback(
    (estimate: Estimate, customer?: Customer | null) => {
      const data = prepareEstimateData(estimate, customer);
      generator.print(data);
    },
    [generator, prepareEstimateData]
  );

  const openEstimate = useCallback(
    (estimate: Estimate, customer?: Customer | null) => {
      const data = prepareEstimateData(estimate, customer);
      generator.open(data);
    },
    [generator, prepareEstimateData]
  );

  // ============================================================================
  // PURCHASE INVOICE METHODS
  // ============================================================================

  const preparePurchaseInvoiceData = useCallback(
    (invoice: PurchaseInvoice, supplier?: Customer | null): PDFInvoiceData => {
      const data: PDFInvoiceData = {
        documentType: "purchase-invoice",
        documentNumber: invoice.invoiceNumber,
        date: invoice.date,
        partyLabel: "Supplier",
        partyInfo: customerToPartyInfo(invoice.customerName, supplier), // customerName is supplier name
        items: itemsToPDFLineItems(invoice.items),
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        discountAmount: invoice.discountAmount,
        total: invoice.total,
      };

      if (invoice.dueDate) data.dueDate = invoice.dueDate;
      if (invoice.amountPaid !== undefined) data.amountPaid = invoice.amountPaid;
      if (invoice.amountDue !== undefined) data.amountDue = invoice.amountDue;
      if (invoice.notes) data.notes = invoice.notes;

      return data;
    },
    []
  );

  const downloadPurchaseInvoice = useCallback(
    (invoice: PurchaseInvoice, supplier?: Customer | null) => {
      const data = preparePurchaseInvoiceData(invoice, supplier);
      generator.download(data, `${invoice.invoiceNumber}.pdf`);
    },
    [generator, preparePurchaseInvoiceData]
  );

  const printPurchaseInvoice = useCallback(
    (invoice: PurchaseInvoice, supplier?: Customer | null) => {
      const data = preparePurchaseInvoiceData(invoice, supplier);
      generator.print(data);
    },
    [generator, preparePurchaseInvoiceData]
  );

  const openPurchaseInvoice = useCallback(
    (invoice: PurchaseInvoice, supplier?: Customer | null) => {
      const data = preparePurchaseInvoiceData(invoice, supplier);
      generator.open(data);
    },
    [generator, preparePurchaseInvoiceData]
  );

  // ============================================================================
  // CREDIT NOTE METHODS
  // ============================================================================

  const prepareCreditNoteData = useCallback(
    (note: CreditNote, customer?: Customer | null): PDFInvoiceData => {
      const data: PDFInvoiceData = {
        documentType: "credit-note",
        documentNumber: note.creditNoteNumber,
        date: note.date,
        partyLabel: "Bill To",
        partyInfo: customerToPartyInfo(note.customerName, customer),
        items: itemsToPDFLineItems(note.items),
        subtotal: note.subtotal,
        taxAmount: note.taxAmount,
        discountAmount: 0,
        total: note.total,
      };

      if (note.notes) data.notes = note.notes;
      if (note.invoiceNumber) data.originalInvoiceNumber = note.invoiceNumber;
      if (note.reason) data.reason = note.reason;

      return data;
    },
    []
  );

  const downloadCreditNote = useCallback(
    (note: CreditNote, customer?: Customer | null) => {
      const data = prepareCreditNoteData(note, customer);
      generator.download(data, `${note.creditNoteNumber}.pdf`);
    },
    [generator, prepareCreditNoteData]
  );

  const printCreditNote = useCallback(
    (note: CreditNote, customer?: Customer | null) => {
      const data = prepareCreditNoteData(note, customer);
      generator.print(data);
    },
    [generator, prepareCreditNoteData]
  );

  const openCreditNote = useCallback(
    (note: CreditNote, customer?: Customer | null) => {
      const data = prepareCreditNoteData(note, customer);
      generator.open(data);
    },
    [generator, prepareCreditNoteData]
  );

  return {
    // Sale Invoice
    downloadSaleInvoice,
    printSaleInvoice,
    openSaleInvoice,

    // Estimate
    downloadEstimate,
    printEstimate,
    openEstimate,

    // Purchase Invoice
    downloadPurchaseInvoice,
    printPurchaseInvoice,
    openPurchaseInvoice,

    // Credit Note
    downloadCreditNote,
    printCreditNote,
    openCreditNote,

    // State - always ready since we have fallback company info
    isReady: true,
  };
}
