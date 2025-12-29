import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import { Button, Modal, ModalContent, ModalHeader, ModalBody } from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { PurchaseInvoiceList, PurchaseInvoiceDetail, PurchaseInvoiceForm } from "./components";
import { usePurchaseInvoices, usePurchaseInvoiceMutations } from "@/hooks/usePurchaseInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import { useItems } from "@/hooks/useItems";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import type { PurchaseInvoice, PurchaseInvoiceFormData } from "./types";

export function PurchaseInvoicesPage() {
  // Data from PowerSync
  const { invoices, isLoading, error } = usePurchaseInvoices();
  const { customers } = useCustomers({ type: "supplier" });
  const { items } = useItems({ isActive: true });
  const { createInvoice, deleteInvoice } = usePurchaseInvoiceMutations();

  // PDF Generator
  const { printPurchaseInvoice, isReady: pdfReady } = usePDFGenerator();

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
      // Generate invoice number
      const invoiceNumber = `PUR-${Date.now()}`;

      // Lookup supplier name from customerId (suppliers are stored in customers table)
      const supplier = customers.find((c) => c.id === data.customerId);
      const supplierName = supplier?.name ?? "Unknown";

      // Transform form items to include itemName, unit, and amount
      const purchaseItems = data.items.map((formItem) => {
        const item = items.find((i) => i.id === formItem.itemId);
        const subtotal = formItem.quantity * formItem.unitPrice;
        const discountPct = formItem.discountPercent ?? 0;
        const taxPct = formItem.taxPercent ?? 0;
        const discountAmt = subtotal * (discountPct / 100);
        const taxableAmount = subtotal - discountAmt;
        const taxAmt = taxableAmount * (taxPct / 100);
        const amount = taxableAmount + taxAmt;

        return {
          itemId: formItem.itemId,
          itemName: item?.name ?? "Unknown Item",
          quantity: formItem.quantity,
          unit: item?.unit ?? "pcs",
          unitPrice: formItem.unitPrice,
          discountPercent: discountPct,
          taxPercent: taxPct,
          amount,
        };
      });

      // Calculate discount amount from percentage
      const subtotal = purchaseItems.reduce((sum, item) => sum + item.amount, 0);
      const discountAmount = subtotal * ((data.discountPercent ?? 0) / 100);

      await createInvoice(
        {
          invoiceNumber,
          ...(data.supplierInvoiceNumber && { supplierInvoiceNumber: data.supplierInvoiceNumber }),
          supplierId: data.customerId,
          supplierName,
          date: data.date,
          dueDate: data.dueDate ?? data.date, // Default to invoice date if not provided
          status: "unpaid",
          discountAmount,
          ...(data.notes && { notes: data.notes }),
        },
        purchaseItems
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
    // TODO: Navigate to payment-out page or open payment modal
  };

  // PDF handlers
  const handlePrintPurchase = () => {
    if (currentSelectedPurchase && pdfReady) {
      // Note: suppliers are stored in customers table with customerId
      const supplier = customers.find((c) => c.id === currentSelectedPurchase.customerId);
      printPurchaseInvoice(currentSelectedPurchase, supplier);
    }
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
              onEdit={() => { setIsFormOpen(true); }}
              onDelete={() => { void handleDeletePurchase(); }}
              onPrint={handlePrintPurchase}
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
              onSubmit={(data) => { void handleSubmitPurchase(data); }}
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
