import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ConfirmDeleteDialog } from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { ExpenseList, ExpenseDetail, ExpenseForm } from "./components";
import { useExpenses, useExpenseMutations } from "@/hooks/useExpenses";
import { useCustomers } from "@/hooks/useCustomers";
import { useSequenceMutations } from "@/hooks/useSequence";
import type { Expense, ExpenseFormData } from "./types";

export function ExpensesPage() {
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

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

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
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleEditExpense = () => {
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsEditing(false);
  };

  const handleSubmitExpense = async (data: ExpenseFormData) => {
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

  const handleDeleteClick = () => {
    if (currentSelectedExpense) {
      setExpenseToDelete(currentSelectedExpense);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
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
            />
          )}
        </div>

        {/* Expense Detail Panel */}
        {currentSelectedExpense && (
          <div className="w-96 border-l border-slate-200 bg-white overflow-hidden">
            <ExpenseDetail
              expense={currentSelectedExpense}
              onClose={handleCloseDetail}
              onEdit={handleEditExpense}
              onDelete={handleDeleteClick}
              onPrint={() => { /* TODO: Implement print */ }}
            />
          </div>
        )}
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
              initialData={isEditing && currentSelectedExpense ? {
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
              } : undefined}
              onSubmit={(data) => { void handleSubmitExpense(data); }}
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
        onConfirm={() => { void handleConfirmDelete(); }}
        title="Delete Expense"
        itemName={expenseToDelete?.expenseNumber ?? ""}
        itemType="Expense"
        warningMessage="This will permanently delete this expense record."
        isLoading={isSubmitting}
      />
    </div>
  );
}
