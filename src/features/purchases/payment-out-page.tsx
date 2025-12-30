import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ConfirmDeleteDialog } from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { PaymentOutList, PaymentOutDetail, PaymentOutForm } from "./components";
import { usePaymentOuts, usePaymentOutMutations } from "@/hooks/usePaymentOuts";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import type { PaymentOut, PaymentOutFormData } from "./types";

export function PaymentOutPage() {
  // Data from PowerSync
  const { payments, isLoading, error } = usePaymentOuts();
  const { customers } = useCustomers({ type: "supplier" });
  const { invoices } = usePurchaseInvoices({ status: "partial" });
  const { createPayment, deletePayment } = usePaymentOutMutations();

  // State
  const [selectedPayment, setSelectedPayment] = useState<PaymentOut | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentOut | null>(null);

  // Update selected payment when data changes
  const currentSelectedPayment = useMemo(() => {
    if (!selectedPayment) return null;
    return payments.find((p) => p.id === selectedPayment.id) ?? null;
  }, [payments, selectedPayment]);

  // Handlers
  const handlePaymentClick = (payment: PaymentOut) => {
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

  const handleSubmitPayment = async (data: PaymentOutFormData) => {
    setIsSubmitting(true);
    try {
      const customer = customers.find((c) => c.id === data.customerId);
      const invoice = invoices.find((i) => i.id === data.invoiceId);
      await createPayment({
        paymentNumber: `PAY-${Date.now()}`, // Generate payment number
        supplierId: data.customerId,
        supplierName: customer?.name ?? "Unknown",
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
        title="Payment Out"
        description="Record payments made to suppliers"
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
            <PaymentOutList
              payments={payments}
              onPaymentClick={handlePaymentClick}
            />
          )}
        </div>

        {/* Payment Detail Panel */}
        {currentSelectedPayment && (
          <div className="w-96 border-l border-slate-200 bg-white overflow-hidden">
            <PaymentOutDetail
              payment={currentSelectedPayment}
              onClose={handleCloseDetail}
              onEdit={() => { setIsFormOpen(true); }}
              onDelete={handleDeleteClick}
              onPrint={() => { /* TODO: Implement print */ }}
            />
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="xl">
        <ModalContent>
          <ModalHeader onClose={handleCloseForm}>
            Record Payment
          </ModalHeader>
          <ModalBody className="p-0">
            <PaymentOutForm
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
        itemName={paymentToDelete?.paymentNumber ?? ""}
        itemType="Payment"
        warningMessage={
          paymentToDelete?.invoiceId
            ? "This will delete the payment and reverse the balance on the linked invoice."
            : "This will permanently delete this payment record and reverse the supplier balance."
        }
        linkedItems={paymentToDelete?.invoiceId ? [
          { type: "Invoice Link", count: 1, description: "Balance will be reversed" },
        ] : undefined}
        isLoading={isSubmitting}
      />
    </div>
  );
}
