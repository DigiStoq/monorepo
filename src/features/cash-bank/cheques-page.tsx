import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { ChequeList, ChequeDetail, ChequeForm } from "./components";
import { useCheques, useChequeMutations } from "@/hooks/useCheques";
import { useCustomers } from "@/hooks/useCustomers";
import type { Cheque, ChequeFormData } from "./types";

export function ChequesPage(): React.ReactNode {
  // Data from PowerSync
  const { cheques, isLoading, error } = useCheques();
  const { customers } = useCustomers();
  const { createCheque, updateChequeStatus, deleteCheque } =
    useChequeMutations();

  // State
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Update selected cheque when data changes
  const currentSelectedCheque = useMemo(() => {
    if (!selectedCheque) return null;
    return cheques.find((c) => c.id === selectedCheque.id) ?? null;
  }, [cheques, selectedCheque]);

  // Handlers
  const handleChequeClick = (cheque: Cheque): void => {
    setSelectedCheque(cheque);
  };

  const handleCloseDetail = (): void => {
    setSelectedCheque(null);
  };

  const handleCreateCheque = (): void => {
    setIsFormOpen(true);
  };

  const handleCloseForm = (): void => {
    setIsFormOpen(false);
  };

  const handleSubmitCheque = async (data: ChequeFormData): Promise<void> => {
    try {
      // Find customer name from ID
      const customer = customers.find((c) => c.id === data.customerId);
      await createCheque({
        chequeNumber: data.chequeNumber,
        type: data.type,
        customerId: data.customerId,
        customerName: customer?.name ?? "",
        bankName: data.bankName,
        date: data.date,
        dueDate: data.dueDate,
        amount: data.amount,
        relatedInvoiceId: data.relatedInvoiceId,
        notes: data.notes,
      });
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to create cheque:", err);
    }
  };

  const handleDeleteCheque = async (): Promise<void> => {
    if (currentSelectedCheque) {
      try {
        await deleteCheque(currentSelectedCheque.id);
        setSelectedCheque(null);
      } catch (err) {
        console.error("Failed to delete cheque:", err);
      }
    }
  };

  const handleMarkCleared = async (): Promise<void> => {
    if (currentSelectedCheque) {
      try {
        await updateChequeStatus(currentSelectedCheque.id, "cleared");
      } catch (err) {
        console.error("Failed to mark cheque as cleared:", err);
      }
    }
  };

  const handleMarkBounced = async (): Promise<void> => {
    if (currentSelectedCheque) {
      try {
        await updateChequeStatus(currentSelectedCheque.id, "bounced");
      } catch (err) {
        console.error("Failed to mark cheque as bounced:", err);
      }
    }
  };

  const handleCancelCheque = async (): Promise<void> => {
    if (currentSelectedCheque) {
      try {
        await updateChequeStatus(currentSelectedCheque.id, "cancelled");
      } catch (err) {
        console.error("Failed to cancel cheque:", err);
      }
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load cheques</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Cheques"
        description="Manage received and issued cheques"
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleCreateCheque}
          >
            Add Cheque
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Cheque List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <ChequeList cheques={cheques} onChequeClick={handleChequeClick} />
          )}
        </div>

        {/* Cheque Detail Panel */}
        {currentSelectedCheque && (
          <div className="w-96 border-l border-slate-200 bg-white overflow-hidden">
            <ChequeDetail
              cheque={currentSelectedCheque}
              onClose={handleCloseDetail}
              onEdit={() => {
                setIsFormOpen(true);
              }}
              onDelete={() => {
                void handleDeleteCheque();
              }}
              onMarkCleared={() => {
                void handleMarkCleared();
              }}
              onMarkBounced={() => {
                void handleMarkBounced();
              }}
              onCancel={() => {
                void handleCancelCheque();
              }}
            />
          </div>
        )}
      </div>

      {/* Cheque Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="xl">
        <ModalContent>
          <ModalHeader onClose={handleCloseForm}>Add Cheque</ModalHeader>
          <ModalBody>
            <ChequeForm
              customers={customers}
              onSubmit={(data) => {
                void handleSubmitCheque(data);
              }}
              onCancel={handleCloseForm}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
