import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout";
import { Button, Modal, ModalContent, ModalHeader, ModalBody } from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { EstimateList, EstimateDetail, EstimateForm } from "./components";
import { useEstimates, useEstimateById, useEstimateMutations } from "@/hooks/useEstimates";
import { useCustomers } from "@/hooks/useCustomers";
import { useItems } from "@/hooks/useItems";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import type { Estimate, EstimateFormData } from "./types";

export function EstimatesPage() {
  const navigate = useNavigate();

  // Data from PowerSync
  const { estimates, isLoading, error } = useEstimates();
  const { customers } = useCustomers({ type: "customer" });
  const { items } = useItems({ isActive: true });
  const { createEstimate, updateEstimateStatus, convertEstimateToInvoice, deleteEstimate } = useEstimateMutations();

  // PDF Generator
  const { downloadEstimate, printEstimate, isReady: pdfReady } = usePDFGenerator();

  // State
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch full estimate with items when one is selected
  const { estimate: selectedEstimateData, items: selectedEstimateItems } = useEstimateById(selectedEstimateId);

  // Combine estimate with its items for the detail component
  const currentSelectedEstimate = useMemo(() => {
    if (!selectedEstimateData) return null;
    return {
      ...selectedEstimateData,
      items: selectedEstimateItems,
    };
  }, [selectedEstimateData, selectedEstimateItems]);

  // Handlers
  const handleEstimateClick = (estimate: Estimate) => {
    setSelectedEstimateId(estimate.id);
  };

  const handleCloseDetail = () => {
    setSelectedEstimateId(null);
  };

  const handleCreateEstimate = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSubmitEstimate = async (data: EstimateFormData) => {
    setIsSubmitting(true);
    try {
      // Generate estimate number
      const estimateNumber = `EST-${Date.now()}`;

      // Lookup customer name from customerId
      const customer = customers.find((c) => c.id === data.customerId);
      const customerName = customer?.name ?? "Unknown";

      // Transform form items to include itemName, unit, and amount
      const estimateItems = data.items.map((formItem) => {
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
      const subtotal = estimateItems.reduce((sum, item) => sum + item.amount, 0);
      const discountAmount = subtotal * ((data.discountPercent ?? 0) / 100);

      await createEstimate(
        {
          estimateNumber,
          customerId: data.customerId,
          customerName,
          date: data.date,
          validUntil: data.validUntil,
          status: "draft",
          discountAmount,
          ...(data.notes && { notes: data.notes }),
          ...(data.terms && { terms: data.terms }),
        },
        estimateItems
      );
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to create estimate:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEstimate = async () => {
    if (currentSelectedEstimate) {
      try {
        await updateEstimateStatus(currentSelectedEstimate.id, "sent");
      } catch (err) {
        console.error("Failed to send estimate:", err);
      }
    }
  };

  const handleMarkAccepted = async () => {
    if (currentSelectedEstimate) {
      try {
        await updateEstimateStatus(currentSelectedEstimate.id, "accepted");
      } catch (err) {
        console.error("Failed to update estimate:", err);
      }
    }
  };

  const handleMarkRejected = async () => {
    if (currentSelectedEstimate) {
      try {
        await updateEstimateStatus(currentSelectedEstimate.id, "rejected");
      } catch (err) {
        console.error("Failed to update estimate:", err);
      }
    }
  };

  const handleConvertToInvoice = async () => {
    if (currentSelectedEstimate && selectedEstimateItems.length > 0) {
      setIsSubmitting(true);
      try {
        // Set due date to 30 days from now
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateStr = dueDate.toISOString().split("T")[0] ?? "";

        await convertEstimateToInvoice(
          currentSelectedEstimate,
          selectedEstimateItems,
          dueDateStr
        );

        // Navigate to the invoices page
        setSelectedEstimateId(null);
        void navigate({ to: "/sale/invoices" });
      } catch (err) {
        console.error("Failed to convert estimate to invoice:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // PDF handlers
  const handlePrintEstimate = () => {
    if (currentSelectedEstimate && pdfReady) {
      const customer = customers.find((c) => c.id === currentSelectedEstimate.customerId);
      printEstimate(currentSelectedEstimate, customer);
    }
  };

  const handleDownloadEstimate = () => {
    if (currentSelectedEstimate && pdfReady) {
      const customer = customers.find((c) => c.id === currentSelectedEstimate.customerId);
      downloadEstimate(currentSelectedEstimate, customer);
    }
  };

  const handleDeleteEstimate = async () => {
    if (currentSelectedEstimate) {
      setIsSubmitting(true);
      try {
        await deleteEstimate(currentSelectedEstimate.id);
        setSelectedEstimateId(null);
      } catch (err) {
        console.error("Failed to delete estimate:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load estimates</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Estimates/Quotations"
        description="Create and manage price quotations for customers"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreateEstimate}>
            New Estimate
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Estimate List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <EstimateList
              estimates={estimates}
              onEstimateClick={handleEstimateClick}
              onCreateEstimate={handleCreateEstimate}
            />
          )}
        </div>

        {/* Estimate Detail Panel */}
        {currentSelectedEstimate && (
          <div className="w-96 border-l border-slate-200 bg-white overflow-hidden">
            <EstimateDetail
              estimate={currentSelectedEstimate}
              onClose={handleCloseDetail}
              onEdit={() => { setIsFormOpen(true); }}
              onDelete={() => { void handleDeleteEstimate(); }}
              onPrint={handlePrintEstimate}
              onShare={handleDownloadEstimate}
              onSend={() => { void handleSendEstimate(); }}
              onMarkAccepted={() => { void handleMarkAccepted(); }}
              onMarkRejected={() => { void handleMarkRejected(); }}
              onConvertToInvoice={() => { void handleConvertToInvoice(); }}
            />
          </div>
        )}
      </div>

      {/* Estimate Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="xl">
        <ModalContent>
          <ModalHeader onClose={handleCloseForm}>New Estimate</ModalHeader>
          <ModalBody className="p-0">
            <EstimateForm
              customers={customers}
              items={items}
              onSubmit={(data) => { void handleSubmitEstimate(data); }}
              onCancel={handleCloseForm}
              className="p-6"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
