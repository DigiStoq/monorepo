import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";
import type { ExpenseRecord } from "../lib/powersync";
import { useAuth } from "../contexts/AuthContext";


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
  paymentMode: "cash" | "bank" | "cheque" | "other";
  referenceNumber?: string;
  description?: string;
  notes?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

function mapRowToExpense(row: ExpenseRecord): Expense {
  return {
    id: row.id,
    expenseNumber: row.expense_number,
    category: row.category as ExpenseCategory,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name || undefined,
    paidToName: row.paid_to_name || undefined,
    paidToDetails: row.paid_to_details || undefined,
    date: row.date,
    amount: row.amount,
    paymentMode: row.payment_mode as Expense["paymentMode"],
    referenceNumber: row.reference_number || undefined,
    description: row.description || undefined,
    notes: row.notes || undefined,
    attachmentUrl: row.attachment_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useExpenses(filters?: {
  category?: ExpenseCategory;
  supplierId?: string;
  paymentMode?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): { expenses: Expense[]; isLoading: boolean; error: Error | null } {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.category) {
      conditions.push("category = ?");
      params.push(filters.category);
    }

    if (filters?.supplierId) {
      conditions.push("customer_id = ?");
      params.push(filters.supplierId);
    }

    if (filters?.paymentMode) {
      conditions.push("payment_mode = ?");
      params.push(filters.paymentMode);
    }

    if (filters?.dateFrom) {
      conditions.push("date >= ?");
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      conditions.push("date <= ?");
      params.push(filters.dateTo);
    }

    if (filters?.search) {
      conditions.push("(expense_number LIKE ? OR description LIKE ?)");
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM expenses ${whereClause} ORDER BY date DESC, created_at DESC`,
      params,
    };
  }, [
    filters?.category,
    filters?.supplierId,
    filters?.paymentMode,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.search,
  ]);

  const { data, isLoading, error } = useQuery<ExpenseRecord>(query, params);

  const expenses = useMemo(() => (data || []).map(mapRowToExpense), [data]);

  return { expenses, isLoading, error: error };
}

export function useExpenseById(id: string | null): {
  expense: Expense | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery<ExpenseRecord>(
    id ? `SELECT * FROM expenses WHERE id = ?` : `SELECT * FROM expenses WHERE 1 = 0`,
    id ? [id] : []
  );

  const expense = data?.[0] ? mapRowToExpense(data[0]) : null;

  return { expense, isLoading, error: error };
}

export function useExpenseMutations() {
  const db = getPowerSyncDatabase();
  const { user } = useAuth();

  const createExpense = useCallback(
    async (data: Omit<Expense, "id" | "createdAt" | "updatedAt">): Promise<string> => {
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO expenses (
          id, expense_number, category, customer_id, customer_name,
          paid_to_name, paid_to_details, date, amount,
          payment_mode, reference_number, description, notes, attachment_url,
          created_at, updated_at, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.expenseNumber,
          data.category,
          data.customerId || null,
          data.customerName || null,
          data.paidToName || null,
          data.paidToDetails || null,
          data.date,
          data.amount,
          data.paymentMode,
          data.referenceNumber || null,
          data.description || null,
          data.notes || null,
          data.attachmentUrl || null,
          now,
          now,
          user?.id || null,
        ]
      );

      return id;
    },
    [db]
  );

  return { createExpense };
}
