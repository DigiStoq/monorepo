import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ConfirmDeleteDialog,
} from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { ExpenseList, ExpenseDetail, ExpenseForm } from "./components";
import { useExpenses, useExpenseMutations } from "@/hooks/useExpenses";
import { useCustomers } from "@/hooks/useCustomers";
import { useSequenceMutations } from "@/hooks/useSequence";
import type { Expense, ExpenseFormData, ExpenseCategory } from "./types";
import { SearchInput, Select, type SelectOption } from "@/components/ui";
import { Receipt, PieChart } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export function ExpensesPage(): React.ReactNode {
  // Data from PowerSync
  const { expenses, isLoading, error } = useExpenses();
  const { customers } = useCustomers({ type: "supplier" });
  const { createExpense, updateExpense, deleteExpense } = useExpenseMutations();
  const { getNextNumber } = useSequenceMutations();

  // State
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  interface ExpenseFilters {
    search: string;
    category: ExpenseCategory | "all";
    sortBy: "date" | "amount";
    sortOrder: "asc" | "desc";
  }

  // Filter State
  const [filters, setFilters] = useState<ExpenseFilters>({
    search: "",
    category: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  const categoryOptions: SelectOption[] = [
    { value: "all", label: "All Categories" },
    { value: "rent", label: "Rent" },
    { value: "utilities", label: "Utilities" },
    { value: "salaries", label: "Salaries" },
    { value: "office", label: "Office" },
    { value: "travel", label: "Travel" },
    { value: "marketing", label: "Marketing" },
    { value: "maintenance", label: "Maintenance" },
    { value: "insurance", label: "Insurance" },
    { value: "taxes", label: "Taxes" },
    { value: "other", label: "Other" },
  ];

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          expense.expenseNumber.toLowerCase().includes(searchLower) ||
          (expense.description?.toLowerCase().includes(searchLower) ?? false) ||
          (expense.customerName?.toLowerCase().includes(searchLower) ??
            false) ||
          (expense.paidToName?.toLowerCase().includes(searchLower) ?? false);

        const matchesCategory =
          filters.category === "all" || expense.category === filters.category;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case "date":
            comparison =
              new Date(b.date).getTime() - new Date(a.date).getTime();
            break;
          case "amount":
            comparison = b.amount - a.amount;
            break;
        }
        return filters.sortOrder === "desc" ? comparison : -comparison;
      });
  }, [expenses, filters]);

  // Totals Calculation
  const totals = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = filteredExpenses.length;
    return { total, count };
  }, [filteredExpenses]);

  const { formatCurrency } = useCurrency();

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Update selected expense when data changes
  const currentSelectedExpense = useMemo(() => {
    if (!selectedExpense) return null;
    return expenses.find((e) => e.id === selectedExpense.id) ?? null;
  }, [expenses, selectedExpense]);

  // Handlers
  const handleExpenseClick = (expense: Expense): void => {
    setSelectedExpense(expense);
  };

  const handleCloseDetail = (): void => {
    setSelectedExpense(null);
  };

  const handleCreateExpense = (): void => {
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleEditExpense = (): void => {
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleCloseForm = (): void => {
    setIsFormOpen(false);
    setIsEditing(false);
  };

  const handleSubmitExpense = async (data: ExpenseFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      if (isEditing && currentSelectedExpense) {
        // Update existing expense
        const customer = customers.find((c) => c.id === data.customerId);
        await updateExpense(currentSelectedExpense.id, {
          category: data.category,
          customerId: data.customerId,
          customerName: customer?.name,
          paidToName: data.paidToName,
          paidToDetails: data.paidToDetails,
          date: data.date,
          amount: data.amount,
          paymentMode: data.paymentMode,
          referenceNumber: data.referenceNumber,
          description: data.description,
          notes: data.notes,
        });
      } else {
        // Create new expense
        const expenseNumber = await getNextNumber("expense");
        const customer = customers.find((c) => c.id === data.customerId);
        await createExpense({
          expenseNumber,
          category: data.category,
          customerId: data.customerId,
          customerName: customer?.name,
          paidToName: data.paidToName,
          paidToDetails: data.paidToDetails,
          date: data.date,
          amount: data.amount,
          paymentMode: data.paymentMode,
          referenceNumber: data.referenceNumber,
          description: data.description,
          notes: data.notes,
        });
      }
      setIsFormOpen(false);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save expense:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (): void => {
    if (currentSelectedExpense) {
      setExpenseToDelete(currentSelectedExpense);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (expenseToDelete) {
      setIsSubmitting(true);
      try {
        await deleteExpense(expenseToDelete.id);
        setSelectedExpense(null);
        setIsDeleteModalOpen(false);
        setExpenseToDelete(null);
      } catch (err) {
        console.error("Failed to delete expense:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load expenses</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Expenses"
        description="Track and categorize business expenses"
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleCreateExpense}
          >
            Record Expense
          </Button>
        }
      />

      {/* Filters Header - Full Width */}
      <div className="bg-card border-b border-border-primary px-6 py-4">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <SearchInput
              placeholder="Search expenses..."
              value={filters.search}
              onChange={(e) => {
                setFilters((f) => ({ ...f, search: e.target.value }));
              }}
              className="w-full sm:w-72"
            />

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Select
                options={categoryOptions}
                value={filters.category}
                onChange={(value) => {
                  setFilters((f) => ({
                    ...f,
                    category: value as ExpenseCategory | "all",
                  }));
                }}
                size="md"
                className="min-w-[140px]"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 border-t xl:border-t-0 pt-4 xl:pt-0 border-slate-100">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 whitespace-nowrap">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <Receipt className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Total Expenses
                </p>
                <p className="text-lg font-bold text-slate-900 leading-none">
                  {formatCurrency(totals.total)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 whitespace-nowrap">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <PieChart className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Count
                </p>
                <p className="text-lg font-bold text-slate-700 leading-none">
                  {totals.count}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-app">
        {/* Expense List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto flex gap-4">
              <div className="w-full max-w-[420px] shrink-0 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2">
                  <ExpenseList
                    expenses={filteredExpenses}
                    onExpenseClick={handleExpenseClick}
                    hasActiveFilters={
                      !!filters.search || filters.category !== "all"
                    }
                  />
                </div>
              </div>

              {/* Detail View */}
              <div className="flex-1 overflow-hidden bg-white rounded-lg border border-slate-200 shadow-sm">
                {currentSelectedExpense ? (
                  <div className="h-full overflow-y-auto">
                    <ExpenseDetail
                      expense={currentSelectedExpense}
                      onClose={handleCloseDetail}
                      onEdit={handleEditExpense}
                      onDelete={handleDeleteClick}
                      onPrint={() => {
                        /* TODO: Implement print */
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Receipt className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">
                      Select an expense to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expense Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="xl">
        <ModalContent>
          <ModalHeader onClose={handleCloseForm}>
            {isEditing ? "Edit Expense" : "Record Expense"}
          </ModalHeader>
          <ModalBody className="p-0">
            <ExpenseForm
              customers={customers}
              initialData={
                isEditing && currentSelectedExpense
                  ? {
                      category: currentSelectedExpense.category,
                      customerId: currentSelectedExpense.customerId,
                      paidToName: currentSelectedExpense.paidToName,
                      paidToDetails: currentSelectedExpense.paidToDetails,
                      date: currentSelectedExpense.date,
                      amount: currentSelectedExpense.amount,
                      paymentMode: currentSelectedExpense.paymentMode,
                      referenceNumber: currentSelectedExpense.referenceNumber,
                      description: currentSelectedExpense.description,
                      notes: currentSelectedExpense.notes,
                    }
                  : undefined
              }
              onSubmit={(data) => {
                void handleSubmitExpense(data);
              }}
              onCancel={handleCloseForm}
              isLoading={isSubmitting}
              className="p-6"
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        title="Delete Expense"
        itemName={expenseToDelete?.expenseNumber ?? ""}
        itemType="Expense"
        warningMessage="This will permanently delete this expense record."
        isLoading={isSubmitting}
      />
    </div>
  );
}
