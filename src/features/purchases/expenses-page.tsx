import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import { Button, Modal, ModalContent, ModalHeader, ModalBody } from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { ExpenseList, ExpenseDetail, ExpenseForm } from "./components";
import { useExpenses, useExpenseMutations } from "@/hooks/useExpenses";
import { useCustomers } from "@/hooks/useCustomers";
import type { Expense, ExpenseFormData } from "./types";

export function ExpensesPage() {
  // Data from PowerSync
  const { expenses, isLoading, error } = useExpenses();
  const { customers } = useCustomers({ type: "supplier" });
  const { createExpense, deleteExpense } = useExpenseMutations();

  // State
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selected expense when data changes
  const currentSelectedExpense = useMemo(() => {
    if (!selectedExpense) return null;
    return expenses.find((e) => e.id === selectedExpense.id) ?? null;
  }, [expenses, selectedExpense]);

  // Handlers
  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense);
  };

  const handleCloseDetail = () => {
    setSelectedExpense(null);
  };

  const handleCreateExpense = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSubmitExpense = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    try {
      await createExpense(data);
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to record expense:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (currentSelectedExpense) {
      setIsSubmitting(true);
      try {
        await deleteExpense(currentSelectedExpense.id);
        setSelectedExpense(null);
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
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreateExpense}>
            Record Expense
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Expense List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <ExpenseList
              expenses={expenses}
              onExpenseClick={handleExpenseClick}
              onCreateExpense={handleCreateExpense}
            />
          )}
        </div>

        {/* Expense Detail Panel */}
        {currentSelectedExpense && (
          <div className="w-96 border-l border-slate-200 bg-white overflow-hidden">
            <ExpenseDetail
              expense={currentSelectedExpense}
              onClose={handleCloseDetail}
              onEdit={() => { setIsFormOpen(true); }}
              onDelete={() => { void handleDeleteExpense(); }}
              onPrint={() => { console.log("Print expense"); }}
            />
          </div>
        )}
      </div>

      {/* Expense Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="xl">
        <ModalContent>
          <ModalHeader onClose={handleCloseForm}>
            Record Expense
          </ModalHeader>
          <ModalBody className="p-0">
            <ExpenseForm
              customers={customers}
              onSubmit={(data) => { void handleSubmitExpense(data); }}
              onCancel={handleCloseForm}
              isSubmitting={isSubmitting}
              className="p-6"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
