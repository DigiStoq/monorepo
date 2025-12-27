// ============================================================================
// CUSTOMER TYPES
// ============================================================================

export type CustomerType = "customer" | "supplier" | "both";

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  phone?: string;
  email?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  openingBalance: number;
  currentBalance: number;
  creditLimit?: number;
  creditDays?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  type: "sale" | "purchase" | "payment-in" | "payment-out" | "credit-note" | "debit-note";
  invoiceNumber?: string;
  date: string;
  amount: number;
  balance: number;
  description?: string;
}

export interface CustomerFormData {
  name: string;
  type: CustomerType;
  phone?: string | undefined;
  email?: string | undefined;
  taxId?: string | undefined;
  address?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  zipCode?: string | undefined;
  openingBalance?: number | undefined;
  creditLimit?: number | undefined;
  creditDays?: number | undefined;
  notes?: string | undefined;
}

export interface CustomerFilters {
  search: string;
  type: CustomerType | "all";
  balanceType: "all" | "receivable" | "payable";
  sortBy: "name" | "balance" | "recent";
  sortOrder: "asc" | "desc";
}
