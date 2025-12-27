import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import { Button, Modal, ModalContent, ModalHeader, ModalBody } from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { PurchaseInvoiceList, PurchaseInvoiceDetail, PurchaseInvoiceForm } from "./components";
import { usePurchaseInvoices, usePurchaseInvoiceMutations } from "@/hooks/usePurchaseInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import { useItems } from "@/hooks/useItems";
import type { PurchaseInvoice, PurchaseInvoiceFormData } from "./types";

export function PurchaseInvoicesPage() {
  // Data from PowerSync
  const { invoices, isLoading, error } = usePurchaseInvoices();
  const { customers } = useCustomers({ type: "supplier" });
  const { items } = useItems({ isActive: true });
  const { createInvoice, updateInvoiceStatus, deleteInvoice } = usePurchaseInvoiceMutations();

  // State
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseInvoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selected purchase when data changes
  const currentSelectedPurchase = useMemo(() => {
    if (!selectedPurchase) return null;
    return invoices.find((p) => p.id === selectedPurchase.id) ?? null;
  }, [invoices, selectedPurchase]);

  // Handlers
  const handlePurchaseClick = (purchase: PurchaseInvoice) => {
    setSelectedPurchase(purchase);
  };

  const handleCloseDetail = () => {
    setSelectedPurchase(null);
  };

  const handleCreatePurchase = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSubmitPurchase = async (data: PurchaseInvoiceFormData) => {
    setIsSubmitting(true);
    try {
      await createInvoice(
        {
          invoiceNumber: data.invoiceNumber,
          supplierInvoiceNumber: data.supplierInvoiceNumber,
          customerId: data.customerId,
          customerName: data.customerName,
          date: data.date,
          dueDate: data.dueDate,
          status: data.status,
          discountAmount: data.discountAmount,
          notes: data.notes,
        },
        data.items
      );
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to create purchase invoice:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePurchase = async () => {
    if (currentSelectedPurchase) {
      setIsSubmitting(true);
      try {
        await deleteInvoice(currentSelectedPurchase.id);
        setSelectedPurchase(null);
      } catch (err) {
        console.error("Failed to delete purchase invoice:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRecordPayment = () => {
    console.log("Record payment for:", currentSelectedPurchase?.id);
    // TODO: Navigate to payment-out page or open payment modal
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load purchase invoices</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Purchase Invoices"
        description="Manage your purchase orders and supplier invoices"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreatePurchase}>
            New Purchase
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Purchase List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <PurchaseInvoiceList
              invoices={invoices}
              onInvoiceClick={handlePurchaseClick}
              onCreateInvoice={handleCreatePurchase}
            />
          )}
        </div>

        {/* Purchase Detail Panel */}
        {currentSelectedPurchase && (
          <div className="w-96 border-l border-slate-200 bg-white overflow-hidden">
            <PurchaseInvoiceDetail
              invoice={currentSelectedPurchase}
              onClose={handleCloseDetail}
              onEdit={() => setIsFormOpen(true)}
              onDelete={handleDeletePurchase}
              onPrint={() => console.log("Print invoice")}
              onRecordPayment={handleRecordPayment}
            />
          </div>
        )}
      </div>

      {/* Purchase Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="full">
        <ModalContent className="max-w-6xl mx-auto my-4 h-[calc(100vh-2rem)]">
          <ModalHeader onClose={handleCloseForm}>
            New Purchase Invoice
          </ModalHeader>
          <ModalBody className="p-0 overflow-y-auto">
            <PurchaseInvoiceForm
              customers={customers}
              items={items}
              onSubmit={handleSubmitPurchase}
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
