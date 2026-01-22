// ============================================================================
// PURCHASE INVOICE TYPES
// ============================================================================

export type PurchaseInvoiceStatus =
  | "draft"
  | "ordered"
  | "received"
  | "paid"
  | "returned";

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierInvoiceNumber?: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  status: PurchaseInvoiceStatus;
  items: PurchaseInvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseInvoiceItem {
  id: string;
  itemId: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  amount: number;
}

export interface PurchaseInvoiceFormData {
  customerId: string;
  supplierInvoiceNumber?: string | undefined;
  date: string;
  dueDate?: string | undefined;
  items: PurchaseInvoiceItemFormData[];
  discountPercent?: number | undefined;
  notes?: string | undefined;
}

export interface PurchaseInvoiceItemFormData {
  itemId: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number | undefined;
  taxPercent?: number | undefined;
}

// ts-prune-ignore-next (exported for future purchase filtering feature)
export interface PurchaseFilters {
  search: string;
  status: PurchaseInvoiceStatus | "all";
  customerId: string;
  dateRange: {
    from: string | null;
    to: string | null;
  };
  sortBy: "date" | "number" | "amount" | "supplier";
  sortOrder: "asc" | "desc";
}

// ============================================================================
// PAYMENT OUT TYPES
// ============================================================================

export type PaymentOutMode =
  | "cash"
  | "bank"
  | "card"
  | "ach"
  | "cheque"
  | "other";

export interface PaymentOut {
  id: string;
  paymentNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMode: PaymentOutMode;
  referenceNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOutFormData {
  customerId: string;
  date: string;
  amount: number;
  paymentMode: PaymentOutMode;
  referenceNumber?: string | undefined;
  invoiceId?: string | undefined;
  notes?: string | undefined;
}

// ============================================================================
// EXPENSE TYPES
// ============================================================================

export type ExpenseCategory =
  | "rent"
  | "utilities"
  | "salaries"
  | "office"
  | "travel"
  | "marketing"
  | "maintenance"
  | "insurance"
  | "taxes"
  | "other";

export interface Expense {
  id: string;
  expenseNumber: string;
  category: ExpenseCategory;
  customerId?: string;
  customerName?: string;
  paidToName?: string;
  paidToDetails?: string;
  date: string;
  amount: number;
  paymentMode: PaymentOutMode;
  referenceNumber?: string;
  description?: string;
  notes?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  category: ExpenseCategory;
  customerId?: string | undefined;
  paidToName?: string | undefined;
  paidToDetails?: string | undefined;
  date: string;
  amount: number;
  paymentMode: PaymentOutMode;
  referenceNumber?: string | undefined;
  description?: string | undefined;
  notes?: string | undefined;
}
