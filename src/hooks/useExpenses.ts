import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { Expense } from "@/features/purchases/types";

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

// Database row type (snake_case columns from SQLite)
interface ExpenseRow {
  id: string;
  expense_number: string;
  category: ExpenseCategory;
  customer_id: string | null;
  customer_name: string | null;
  paid_to_name: string | null;
  paid_to_details: string | null;
  date: string;
  amount: number;
  payment_mode: string;
  reference_number: string | null;
  description: string | null;
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    expenseNumber: row.expense_number,
    category: row.category,
    customerId: row.customer_id ?? undefined,
    customerName: row.customer_name ?? undefined,
    paidToName: row.paid_to_name ?? undefined,
    paidToDetails: row.paid_to_details ?? undefined,
    date: row.date,
    amount: row.amount,
    paymentMode: row.payment_mode as Expense["paymentMode"],
    referenceNumber: row.reference_number ?? undefined,
    description: row.description ?? undefined,
    notes: row.notes ?? undefined,
    attachmentUrl: row.attachment_url ?? undefined,
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
}): { expenses: Expense[]; isLoading: boolean; error: Error | undefined } {
  const params = useMemo(() => {
    const categoryFilter = filters?.category ?? null;
    const supplierFilter = filters?.supplierId ?? null;
    const modeFilter = filters?.paymentMode ?? null;
    const dateFromFilter = filters?.dateFrom ?? null;
    const dateToFilter = filters?.dateTo ?? null;
    const searchFilter = filters?.search ? `%${filters.search}%` : null;
    return [
      categoryFilter,
      supplierFilter,
      modeFilter,
      dateFromFilter,
      dateToFilter,
      searchFilter,
    ];
  }, [
    filters?.category,
    filters?.supplierId,
    filters?.paymentMode,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.search,
  ]);

  const { data, isLoading, error } = useQuery<ExpenseRow>(
    `SELECT * FROM expenses
     WHERE ($1 IS NULL OR category = $1)
     AND ($2 IS NULL OR customer_id = $2)
     AND ($3 IS NULL OR payment_mode = $3)
     AND ($4 IS NULL OR date >= $4)
     AND ($5 IS NULL OR date <= $5)
     AND ($6 IS NULL OR expense_number LIKE $6 OR description LIKE $6)
     ORDER BY date DESC, created_at DESC`,
    params
  );

  const expenses = useMemo(() => data.map(mapRowToExpense), [data]);

  return { expenses, isLoading, error };
}

interface ExpenseMutations {
  createExpense: (data: {
    expenseNumber: string;
    category: ExpenseCategory;
    customerId?: string;
    customerName?: string;
    paidToName?: string;
    paidToDetails?: string;
    date: string;
    amount: number;
    paymentMode: string;
    referenceNumber?: string;
    description?: string;
    notes?: string;
    attachmentUrl?: string;
  }) => Promise<string>;
  updateExpense: (
    id: string,
    data: Partial<{
      category: ExpenseCategory;
      customerId: string;
      customerName: string;
      paidToName: string;
      paidToDetails: string;
      date: string;
      amount: number;
      paymentMode: string;
      referenceNumber: string;
      description: string;
      notes: string;
      attachmentUrl: string;
    }>
  ) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export function useExpenseMutations(): ExpenseMutations {
  const db = getPowerSyncDatabase();

  const createExpense = useCallback(
    async (data: {
      expenseNumber: string;
      category: ExpenseCategory;
      customerId?: string;
      customerName?: string;
      paidToName?: string;
      paidToDetails?: string;
      date: string;
      amount: number;
      paymentMode: string;
      referenceNumber?: string;
      description?: string;
      notes?: string;
      attachmentUrl?: string;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO expenses (
          id, expense_number, category, customer_id, customer_name,
          paid_to_name, paid_to_details, date, amount,
          payment_mode, reference_number, description, notes, attachment_url,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.expenseNumber,
          data.category,
          data.customerId ?? null,
          data.customerName ?? null,
          data.paidToName ?? null,
          data.paidToDetails ?? null,
          data.date,
          data.amount,
          data.paymentMode,
          data.referenceNumber ?? null,
          data.description ?? null,
          data.notes ?? null,
          data.attachmentUrl ?? null,
          now,
          now,
        ]
      );

      return id;
    },
    [db]
  );

  const updateExpense = useCallback(
    async (
      id: string,
      data: Partial<{
        category: ExpenseCategory;
        customerId: string;
        customerName: string;
        paidToName: string;
        paidToDetails: string;
        date: string;
        amount: number;
        paymentMode: string;
        referenceNumber: string;
        description: string;
        notes: string;
        attachmentUrl: string;
      }>
    ): Promise<void> => {
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      if (data.category !== undefined) {
        fields.push("category = ?");
        values.push(data.category);
      }
      if (data.customerId !== undefined) {
        fields.push("customer_id = ?");
        values.push(data.customerId);
      }
      if (data.customerName !== undefined) {
        fields.push("customer_name = ?");
        values.push(data.customerName);
      }
      if (data.paidToName !== undefined) {
        fields.push("paid_to_name = ?");
        values.push(data.paidToName);
      }
      if (data.paidToDetails !== undefined) {
        fields.push("paid_to_details = ?");
        values.push(data.paidToDetails);
      }
      if (data.date !== undefined) {
        fields.push("date = ?");
        values.push(data.date);
      }
      if (data.amount !== undefined) {
        fields.push("amount = ?");
        values.push(data.amount);
      }
      if (data.paymentMode !== undefined) {
        fields.push("payment_mode = ?");
        values.push(data.paymentMode);
      }
      if (data.referenceNumber !== undefined) {
        fields.push("reference_number = ?");
        values.push(data.referenceNumber);
      }
      if (data.description !== undefined) {
        fields.push("description = ?");
        values.push(data.description);
      }
      if (data.notes !== undefined) {
        fields.push("notes = ?");
        values.push(data.notes);
      }
      if (data.attachmentUrl !== undefined) {
        fields.push("attachment_url = ?");
        values.push(data.attachmentUrl);
      }

      fields.push("updated_at = ?");
      values.push(now);
      values.push(id);

      if (fields.length > 1) {
        await db.execute(
          `UPDATE expenses SET ${fields.join(", ")} WHERE id = ?`,
          values
        );
      }
    },
    [db]
  );

  const deleteExpense = useCallback(
    async (id: string): Promise<void> => {
      await db.execute(`DELETE FROM expenses WHERE id = ?`, [id]);
    },
    [db]
  );

  return {
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
