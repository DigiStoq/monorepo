import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { InvoiceList, InvoiceDetail, InvoiceForm } from "./components";
import { useSaleInvoices, useSaleInvoiceMutations } from "@/hooks/useSaleInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import { useItems } from "@/hooks/useItems";
import type { SaleInvoice, SaleInvoiceFormData } from "./types";

export function SaleInvoicesPage() {
  // Data from PowerSync
  const { invoices, isLoading: invoicesLoading, error } = useSaleInvoices();
  const { customers } = useCustomers({ type: "customer" });
  const { items } = useItems({ isActive: true });
  const { createInvoice, updateInvoiceStatus, deleteInvoice } = useSaleInvoiceMutations();

  // State
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<SaleInvoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selected invoice when data changes
  const currentSelectedInvoice = useMemo(() => {
    if (!selectedInvoice) return null;
    return invoices.find((i) => i.id === selectedInvoice.id) ?? null;
  }, [invoices, selectedInvoice]);

  // Handlers
  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setIsCreating(true);
  };

  const handleEditInvoice = () => {
    console.log("Edit invoice:", currentSelectedInvoice?.id);
  };

  const handleDeleteInvoice = () => {
    if (currentSelectedInvoice) {
      setInvoiceToDelete(currentSelectedInvoice);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (invoiceToDelete) {
      setIsSubmitting(true);
      try {
        await deleteInvoice(invoiceToDelete.id);
        setIsDeleteModalOpen(false);
        setInvoiceToDelete(null);
        setSelectedInvoice(null);
      } catch (err) {
        console.error("Failed to delete invoice:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFormSubmit = async (data: SaleInvoiceFormData) => {
    setIsSubmitting(true);
    try {
      await createInvoice(
        {
          invoiceNumber: data.invoiceNumber,
          customerId: data.customerId,
          customerName: data.customerName,
          date: data.date,
          dueDate: data.dueDate,
          status: data.status,
          discountAmount: data.discountAmount,
          notes: data.notes,
          terms: data.terms,
        },
        data.items
      );
      setIsCreating(false);
    } catch (err) {
      console.error("Failed to create invoice:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvoice = async () => {
    if (currentSelectedInvoice) {
      try {
        await updateInvoiceStatus(currentSelectedInvoice.id, "sent");
      } catch (err) {
        console.error("Failed to send invoice:", err);
      }
    }
  };

  const handleRecordPayment = () => {
    console.log("Record payment for:", currentSelectedInvoice?.id);
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load invoices</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // Show invoice form when creating
  if (isCreating) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto p-4">
          <InvoiceForm
            customers={customers}
            items={items}
            onSubmit={(data) => { void handleFormSubmit(data); }}
            onCancel={() => { setIsCreating(false); }}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <PageHeader
        title="Sale Invoices"
        description="Manage your sales and invoices"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreateInvoice}>
            New Invoice
          </Button>
        }
      />

      {/* Content - Master-Detail Layout */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Invoice List (Master) */}
        <div className="w-[420px] shrink-0 overflow-auto">
          {invoicesLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <InvoiceList
              invoices={invoices}
              onInvoiceClick={setSelectedInvoice}
              onCreateInvoice={handleCreateInvoice}
              className="h-full"
            />
          )}
        </div>

        {/* Invoice Detail (Detail) */}
        <div className="flex-1 overflow-auto">
          <InvoiceDetail
            invoice={currentSelectedInvoice}
            onEdit={handleEditInvoice}
            onDelete={() => { handleDeleteInvoice(); }}
            onSend={() => { void handleSendInvoice(); }}
            onRecordPayment={handleRecordPayment}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setInvoiceToDelete(null);
        }}
        size="sm"
      >
        <ModalContent>
          <ModalHeader title="Delete Invoice" />
          <ModalBody>
            <p className="text-slate-600">
              Are you sure you want to delete invoice{" "}
              <span className="font-semibold text-slate-900">
                {invoiceToDelete?.invoiceNumber}
              </span>
              ? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setInvoiceToDelete(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={() => { void handleConfirmDelete(); }} isLoading={isSubmitting}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
