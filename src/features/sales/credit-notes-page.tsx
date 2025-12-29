import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { CreditNoteList, CreditNoteDetail } from "./components";
import { useCreditNotes, useCreditNoteMutations } from "@/hooks/useCreditNotes";
import { useCustomers } from "@/hooks/useCustomers";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import type { CreditNote } from "./types";

export function CreditNotesPage() {
  // Data from PowerSync
  const { creditNotes, isLoading, error } = useCreditNotes();
  const { deleteCreditNote } = useCreditNoteMutations();
  const { customers } = useCustomers({ type: "customer" });

  // PDF Generator
  const { downloadCreditNote, printCreditNote, isReady: pdfReady } = usePDFGenerator();

  // State
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Update selected credit note when data changes
  const currentSelectedCreditNote = useMemo(() => {
    if (!selectedCreditNote) return null;
    return creditNotes.find((cn) => cn.id === selectedCreditNote.id) ?? null;
  }, [creditNotes, selectedCreditNote]);

  // Handlers
  const handleCreditNoteClick = (creditNote: CreditNote) => {
    setSelectedCreditNote(creditNote);
  };

  const handleCloseDetail = () => {
    setSelectedCreditNote(null);
  };

  const handleCreateCreditNote = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleDeleteCreditNote = async () => {
    if (currentSelectedCreditNote) {
      try {
        await deleteCreditNote(currentSelectedCreditNote.id);
        setSelectedCreditNote(null);
      } catch (err) {
        console.error("Failed to delete credit note:", err);
      }
    }
  };

  // PDF handlers
  const handlePrintCreditNote = () => {
    if (currentSelectedCreditNote && pdfReady) {
      const customer = customers.find((c) => c.id === currentSelectedCreditNote.customerId);
      printCreditNote(currentSelectedCreditNote, customer);
    }
  };

  const handleDownloadCreditNote = () => {
    if (currentSelectedCreditNote && pdfReady) {
      const customer = customers.find((c) => c.id === currentSelectedCreditNote.customerId);
      downloadCreditNote(currentSelectedCreditNote, customer);
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load credit notes</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Credit Notes"
        description="Manage credit notes for returns, discounts, and corrections"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreateCreditNote}>
            New Credit Note
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Credit Note List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <CreditNoteList
              creditNotes={creditNotes}
              onCreditNoteClick={handleCreditNoteClick}
            />
          )}
        </div>

        {/* Credit Note Detail Panel */}
        {currentSelectedCreditNote && (
          <div className="w-96 border-l border-slate-200 bg-white overflow-hidden">
            <CreditNoteDetail
              creditNote={currentSelectedCreditNote}
              onClose={handleCloseDetail}
              onEdit={() => { setIsFormOpen(true); }}
              onDelete={() => { void handleDeleteCreditNote(); }}
              onPrint={handlePrintCreditNote}
              onShare={handleDownloadCreditNote}
            />
          </div>
        )}
      </div>

      {/* Credit Note Form Modal - Placeholder */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="md">
        <ModalContent>
          <ModalHeader onClose={handleCloseForm}>New Credit Note</ModalHeader>
          <ModalBody>
            <p className="text-slate-600">
              Credit note creation form will be implemented here.
              For now, credit notes can be created from the invoice detail page.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={handleCloseForm}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
