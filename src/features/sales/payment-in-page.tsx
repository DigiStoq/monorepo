import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ConfirmDeleteDialog } from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { PaymentInList, PaymentInDetail, PaymentInForm } from "./components";
import { usePaymentIns, usePaymentInMutations } from "@/hooks/usePaymentIns";
import { useSaleInvoices } from "@/hooks/useSaleInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import type { PaymentIn, PaymentInFormData } from "./types";

export function PaymentInPage() {
  // Data from PowerSync
  const { payments, isLoading, error } = usePaymentIns();
  const { customers } = useCustomers({ type: "customer" });
  const { invoices } = useSaleInvoices({ status: "partial" });
  const { createPayment, deletePayment } = usePaymentInMutations();

  // State
  const [selectedPayment, setSelectedPayment] = useState<PaymentIn | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentIn | null>(null);

  // Update selected payment when data changes
  const currentSelectedPayment = useMemo(() => {
    if (!selectedPayment) return null;
    return payments.find((p) => p.id === selectedPayment.id) ?? null;
  }, [payments, selectedPayment]);

  // Handlers
  const handlePaymentClick = (payment: PaymentIn) => {
    setSelectedPayment(payment);
  };

  const handleCloseDetail = () => {
    setSelectedPayment(null);
  };

  const handleRecordPayment = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSubmitPayment = async (data: PaymentInFormData) => {
    setIsSubmitting(true);
    try {
      const customer = customers.find((c) => c.id === data.customerId);
      const invoice = invoices.find((i) => i.id === data.invoiceId);
      await createPayment({
        receiptNumber: `REC-${Date.now()}`,
        customerId: data.customerId,
        customerName: customer?.name ?? "Unknown",
        date: data.date,
        amount: data.amount,
        paymentMode: data.paymentMode,
        referenceNumber: data.referenceNumber,
        invoiceId: data.invoiceId,
        invoiceNumber: invoice?.invoiceNumber,
        notes: data.notes,
      });
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to record payment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    if (currentSelectedPayment) {
      setPaymentToDelete(currentSelectedPayment);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (paymentToDelete) {
      setIsSubmitting(true);
      try {
        await deletePayment(paymentToDelete.id);
        setSelectedPayment(null);
        setIsDeleteModalOpen(false);
        setPaymentToDelete(null);
      } catch (err) {
        console.error("Failed to delete payment:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load payments</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Payment In"
        description="Track payments received from customers"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleRecordPayment}>
            Record Payment
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Payment List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <PaymentInList
              payments={payments}
              onPaymentClick={handlePaymentClick}
              onRecordPayment={handleRecordPayment}
            />
          )}
        </div>

        {/* Payment Detail Panel */}
        {currentSelectedPayment && (
          <div className="w-96 border-l border-slate-200 bg-white overflow-hidden">
            <PaymentInDetail
              payment={currentSelectedPayment}
              onClose={handleCloseDetail}
              onEdit={() => {
                setIsFormOpen(true);
              }}
              onDelete={handleDeleteClick}
              onPrint={() => { /* TODO: Implement print */ }}
              onShare={() => { /* TODO: Implement share */ }}
            />
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="xl">
        <ModalContent>
          <ModalHeader onClose={handleCloseForm}>Record Payment</ModalHeader>
          <ModalBody className="p-0">
            <PaymentInForm
              customers={customers}
              invoices={invoices}
              onSubmit={(data) => { void handleSubmitPayment(data); }}
              onCancel={handleCloseForm}
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
          setPaymentToDelete(null);
        }}
        onConfirm={() => { void handleConfirmDelete(); }}
        title="Delete Payment"
        itemName={paymentToDelete?.receiptNumber ?? ""}
        itemType="Payment"
        warningMessage={
          paymentToDelete?.invoiceId
            ? "This will delete the payment and reverse the balance on the linked invoice."
            : "This will permanently delete this payment record and reverse the customer balance."
        }
        linkedItems={paymentToDelete?.invoiceId ? [
          { type: "Invoice Link", count: 1, description: "Balance will be reversed" },
        ] : undefined}
        isLoading={isSubmitting}
      />
    </div>
  );
}
