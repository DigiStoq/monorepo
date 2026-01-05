// ============================================================================
// SALE TYPES
// ============================================================================

export type InvoiceStatus = "draft" | "unpaid" | "paid" | "returned";

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  items: SaleInvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  terms?: string;
  transportName?: string;
  deliveryDate?: string;
  deliveryLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleInvoiceItem {
  id: string;
  itemId: string;
  itemName: string;
  description?: string;
  batchNumber?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  mrp?: number;
  discountPercent?: number;
  taxPercent?: number;
  amount: number;
}

export interface SaleInvoiceFormData {
  customerId: string;
  date: string;
  dueDate?: string | undefined;
  items: SaleInvoiceItemFormData[];
  discountPercent?: number | undefined;
  notes?: string | undefined;
  terms?: string | undefined;
  transportName?: string | undefined;
  deliveryDate?: string | undefined;
  deliveryLocation?: string | undefined;
}

// Form data used for creating an invoice (dueDate is required by database)
export interface InvoiceFormData {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  status?: string;
  discountAmount?: number;
  notes?: string;
  terms?: string;
  transportName?: string;
  deliveryDate?: string;
  deliveryLocation?: string;
}

export interface SaleInvoiceItemFormData {
  itemId: string;
  batchNumber?: string | undefined;
  quantity: number;
  unitPrice: number;
  mrp?: number | undefined;
  discountPercent?: number | undefined;
  taxPercent?: number | undefined;
}

export interface SaleFilters {
  search: string;
  status: InvoiceStatus | "all";
  customerId: string;
  dateRange: {
    from: string | null;
    to: string | null;
  };
  sortBy: "date" | "number" | "amount" | "customer";
  sortOrder: "asc" | "desc";
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export type PaymentMode = "cash" | "bank" | "card" | "ach" | "cheque" | "other";

export interface PaymentIn {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInFormData {
  customerId: string;
  date: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string | undefined;
  invoiceId?: string | undefined;
  notes?: string | undefined;
}

// ============================================================================
// ESTIMATE TYPES
// ============================================================================

export type EstimateStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted";

export interface EstimateItem {
  id: string;
  estimateId: string;
  itemId?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  amount: number;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  validUntil: string;
  status: EstimateStatus;
  items: EstimateItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
  terms?: string;
  convertedToInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateFormData {
  customerId: string;
  date: string;
  validUntil: string;
  items: SaleInvoiceItemFormData[];
  discountPercent?: number | undefined;
  notes?: string | undefined;
  terms?: string | undefined;
}

// ============================================================================
// CREDIT NOTE TYPES
// ============================================================================

export type CreditNoteReason = "return" | "discount" | "error" | "other";

export interface CreditNoteItem {
  id: string;
  creditNoteId: string;
  itemId?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  taxPercent?: number;
  amount: number;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  invoiceId?: string;
  invoiceNumber?: string;
  reason: CreditNoteReason;
  items: SaleInvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
