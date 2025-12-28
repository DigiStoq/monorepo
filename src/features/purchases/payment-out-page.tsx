import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import { Button, Modal, ModalContent, ModalHeader, ModalBody } from "@/components/ui";
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
      await createPayment(data);
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to record payment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async () => {
    if (currentSelectedPayment) {
      setIsSubmitting(true);
      try {
        await deletePayment(currentSelectedPayment.id);
        setSelectedPayment(null);
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
              onRecordPayment={handleRecordPayment}
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
              onDelete={() => { void handleDeletePayment(); }}
              onPrint={() => { console.log("Print payment"); }}
              onShare={() => { console.log("Share payment"); }}
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
              isSubmitting={isSubmitting}
              className="p-6"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
