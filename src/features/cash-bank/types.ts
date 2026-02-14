// ============================================================================
// BANK ACCOUNT TYPES
// ============================================================================

export type BankAccountType =
  | "savings"
  | "checking"
  | "credit"
  | "loan"
  | "other";

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  accountType: BankAccountType;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountFormData {
  name: string;
  bankName: string;
  accountNumber: string;
  accountType: BankAccountType;
  openingBalance: number;
  notes?: string | undefined;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  type: "deposit" | "withdrawal" | "transfer";
  amount: number;
  description: string;
  referenceNumber?: string;
  relatedCustomerId?: string;
  relatedCustomerName?: string;
  relatedInvoiceId?: string;
  relatedInvoiceNumber?: string;
  balance: number;
  createdAt: string;
}

// ============================================================================
// CASH IN HAND TYPES
// ============================================================================

export interface CashTransaction {
  id: string;
  date: string;
  type: "in" | "out" | "adjustment";
  amount: number;
  description: string;
  category?: string;
  relatedCustomerId?: string;
  relatedCustomerName?: string;
  relatedInvoiceId?: string;
  relatedInvoiceNumber?: string;
  balance: number;
  createdAt: string;
}

export interface CashAdjustmentFormData {
  date: string;
  type: "add" | "subtract";
  amount: number;
  description: string;
}

// ============================================================================
// CHEQUE TYPES
// ============================================================================

export type ChequeStatus = "pending" | "cleared" | "bounced" | "cancelled";
export type ChequeType = "received" | "issued";

export interface Cheque {
  id: string;
  chequeNumber: string;
  type: ChequeType;
  customerId: string;
  customerName: string;
  bankName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: ChequeStatus;
  relatedInvoiceId?: string;
  relatedInvoiceNumber?: string;
  notes?: string;
  clearedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChequeFormData {
  chequeNumber: string;
  type: ChequeType;
  customerId: string;
  bankName: string;
  date: string;
  dueDate: string;
  amount: number;
  relatedInvoiceId?: string | undefined;
  notes?: string | undefined;
}

// ============================================================================
// LOAN TYPES
// ============================================================================

export type LoanType = "taken" | "given";
export type LoanStatus = "active" | "closed" | "defaulted";

export interface Loan {
  id: string;
  name: string;
  type: LoanType;
  customerId?: string;
  customerName?: string;
  lenderName?: string;
  principalAmount: number;
  outstandingAmount: number;
  interestRate: number;
  interestType: "simple" | "compound";
  startDate: string;
  endDate?: string;
  emiAmount?: number;
  emiDay?: number;
  totalEmis?: number;
  paidEmis: number;
  status: LoanStatus;
  notes?: string;
  linkedBankAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  date: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paymentMethod: "cash" | "bank" | "cheque";
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface LoanFormData {
  name: string;
  type: LoanType;
  customerId?: string | undefined;
  lenderName?: string | undefined;
  principalAmount: number;
  interestRate: number;
  interestType: "simple" | "compound";
  startDate: string;
  endDate?: string | undefined;
  emiAmount?: number | undefined;
  emiDay?: number | undefined;
  totalEmis?: number | undefined;
  linkedBankAccountId?: string | undefined;
  notes?: string | undefined;
}

export interface LoanPaymentFormData {
  date: string;
  principalAmount: number;
  interestAmount: number;
  paymentMethod: "cash" | "bank" | "cheque";
  referenceNumber?: string | undefined;
  notes?: string | undefined;
}

export interface LoanFilters {
  search: string;
  type: LoanType | "all";
  status: LoanStatus | "all";
}
