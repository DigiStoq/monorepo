import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import { Button, Modal, ModalContent, ModalHeader, ModalBody } from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { EstimateList, EstimateDetail, EstimateForm } from "./components";
import { useEstimates, useEstimateMutations } from "@/hooks/useEstimates";
import { useCustomers } from "@/hooks/useCustomers";
import { useItems } from "@/hooks/useItems";
import type { Estimate, EstimateFormData } from "./types";

export function EstimatesPage() {
  // Data from PowerSync
  const { estimates, isLoading, error } = useEstimates();
  const { customers } = useCustomers({ type: "customer" });
  const { items } = useItems({ isActive: true });
  const { createEstimate, updateEstimateStatus, deleteEstimate } = useEstimateMutations();

  // State
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selected estimate when data changes
  const currentSelectedEstimate = useMemo(() => {
    if (!selectedEstimate) return null;
    return estimates.find((e) => e.id === selectedEstimate.id) ?? null;
  }, [estimates, selectedEstimate]);

  // Handlers
  const handleEstimateClick = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
  };

  const handleCloseDetail = () => {
    setSelectedEstimate(null);
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
      await createEstimate(
        {
          estimateNumber: data.estimateNumber,
          customerId: data.customerId,
          customerName: data.customerName,
          date: data.date,
          validUntil: data.validUntil,
          status: data.status,
          discountAmount: data.discountAmount,
          notes: data.notes,
          terms: data.terms,
        },
        data.items
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

  const handleConvertToInvoice = () => {
    console.log("Convert to invoice:", currentSelectedEstimate?.id);
    // TODO: Implement conversion
  };

  const handleDeleteEstimate = async () => {
    if (currentSelectedEstimate) {
      setIsSubmitting(true);
      try {
        await deleteEstimate(currentSelectedEstimate.id);
        setSelectedEstimate(null);
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
              onEdit={() => setIsFormOpen(true)}
              onDelete={handleDeleteEstimate}
              onPrint={() => console.log("Print estimate")}
              onShare={() => console.log("Share estimate")}
              onSend={handleSendEstimate}
              onMarkAccepted={handleMarkAccepted}
              onMarkRejected={handleMarkRejected}
              onConvertToInvoice={handleConvertToInvoice}
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
              onSubmit={handleSubmitEstimate}
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
