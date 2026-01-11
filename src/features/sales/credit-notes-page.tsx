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
import { CreditNoteList, CreditNoteDetail } from "./components";
import { useCreditNotes, useCreditNoteMutations } from "@/hooks/useCreditNotes";
import { useCustomers } from "@/hooks/useCustomers";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import type { CreditNote, CreditNoteReason } from "./types";
import { SearchInput, Select, type SelectOption } from "@/components/ui";
import { FileText, RotateCcw, Percent } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export function CreditNotesPage(): React.ReactNode {
  // Data from PowerSync
  const { creditNotes, isLoading, error } = useCreditNotes();
  const { deleteCreditNote } = useCreditNoteMutations();
  const { customers } = useCustomers({ type: "customer" });

  // PDF Generator
  const {
    downloadCreditNote,
    printCreditNote,
    isReady: pdfReady,
  } = usePDFGenerator();

  // State
  const [selectedCreditNote, setSelectedCreditNote] =
    useState<CreditNote | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  interface CreditNoteFilters {
    search: string;
    reason: CreditNoteReason | "all";
    sortBy: "date" | "amount" | "customer";
    sortOrder: "asc" | "desc";
  }

  // Filter State
  const [filters, setFilters] = useState<CreditNoteFilters>({
    search: "",
    reason: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  const reasonOptions: SelectOption[] = [
    { value: "all", label: "All Reasons" },
    { value: "return", label: "Return" },
    { value: "discount", label: "Discount" },
    { value: "error", label: "Error Correction" },
    { value: "other", label: "Other" },
  ];

  // Filter Logic
  const filteredCreditNotes = useMemo(() => {
    return creditNotes
      .filter((cn) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesNumber = cn.creditNoteNumber
            .toLowerCase()
            .includes(searchLower);
          const matchesCustomer = cn.customerName
            .toLowerCase()
            .includes(searchLower);
          const matchesInvoice =
            cn.invoiceNumber?.toLowerCase().includes(searchLower) ?? false;
          if (!matchesNumber && !matchesCustomer && !matchesInvoice)
            return false;
        }

        // Reason filter
        if (filters.reason !== "all" && cn.reason !== filters.reason) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (filters.sortBy) {
          case "date":
            comparison =
              new Date(b.date).getTime() - new Date(a.date).getTime();
            break;
          case "amount":
            comparison = b.total - a.total;
            break;
          case "customer":
            comparison = a.customerName.localeCompare(b.customerName);
            break;
        }

        return filters.sortOrder === "desc" ? comparison : -comparison;
      });
  }, [creditNotes, filters]);

  // Totals Calculation
  const totals = useMemo(() => {
    if (!filteredCreditNotes.length)
      return { total: 0, returns: 0, discounts: 0, errors: 0 };

    return filteredCreditNotes.reduce(
      (acc, cn) => {
        acc.total += cn.total;
        if (cn.reason === "return") {
          acc.returns += cn.total;
        } else if (cn.reason === "discount") {
          acc.discounts += cn.total;
        } else if (cn.reason === "error") {
          acc.errors += cn.total;
        }
        return acc;
      },
      { total: 0, returns: 0, discounts: 0, errors: 0 }
    );
  }, [filteredCreditNotes]);

  const { formatCurrency } = useCurrency();

  // Update selected credit note when data changes
  const currentSelectedCreditNote = useMemo(() => {
    if (!selectedCreditNote) return null;
    return creditNotes.find((cn) => cn.id === selectedCreditNote.id) ?? null;
  }, [creditNotes, selectedCreditNote]);

  // Handlers
  const handleCreditNoteClick = (creditNote: CreditNote): void => {
    setSelectedCreditNote(creditNote);
  };

  const handleCloseDetail = (): void => {
    setSelectedCreditNote(null);
  };

  const handleCreateCreditNote = (): void => {
    setIsFormOpen(true);
  };

  const handleCloseForm = (): void => {
    setIsFormOpen(false);
  };

  const handleDeleteCreditNote = async (): Promise<void> => {
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
  const handlePrintCreditNote = (): void => {
    if (currentSelectedCreditNote && pdfReady) {
      const customer = customers.find(
        (c) => c.id === currentSelectedCreditNote.customerId
      );
      printCreditNote(currentSelectedCreditNote, customer);
    }
  };

  const handleDownloadCreditNote = (): void => {
    if (currentSelectedCreditNote && pdfReady) {
      const customer = customers.find(
        (c) => c.id === currentSelectedCreditNote.customerId
      );
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
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleCreateCreditNote}
          >
            New Credit Note
          </Button>
        }
      />

      {/* Filters Header - Full Width */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <SearchInput
              placeholder="Search credit notes..."
              value={filters.search}
              onChange={(e) => {
                setFilters((f) => ({ ...f, search: e.target.value }));
              }}
              className="w-full sm:w-72"
            />

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Select
                options={reasonOptions}
                value={filters.reason}
                onChange={(value) => {
                  setFilters((f) => ({
                    ...f,
                    reason: value as CreditNoteReason | "all",
                  }));
                }}
                size="md"
                className="min-w-[140px]"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 border-t xl:border-t-0 pt-4 xl:pt-0 border-slate-100">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 whitespace-nowrap">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <FileText className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Total Credits
                </p>
                <p className="text-lg font-bold text-error leading-none">
                  {formatCurrency(totals.total)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100 whitespace-nowrap">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <RotateCcw className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">
                  Returns
                </p>
                <p className="text-lg font-bold text-blue-700 leading-none">
                  {formatCurrency(totals.returns)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-warning-light rounded-lg border border-warning/20 whitespace-nowrap">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <Percent className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-warning-dark font-medium uppercase tracking-wider">
                  Discounts
                </p>
                <p className="text-lg font-bold text-warning-dark leading-none">
                  {formatCurrency(totals.discounts)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-slate-50">
        {/* Credit Note List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto flex gap-4">
              <div className="w-full max-w-[420px] shrink-0 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2">
                  <CreditNoteList
                    creditNotes={filteredCreditNotes}
                    onCreditNoteClick={handleCreditNoteClick}
                    onCreateCreditNote={handleCreateCreditNote}
                    hasActiveFilters={
                      !!filters.search || filters.reason !== "all"
                    }
                  />
                </div>
              </div>

              {/* Detail View */}
              <div className="flex-1 overflow-hidden bg-white rounded-lg border border-slate-200 shadow-sm">
                {currentSelectedCreditNote ? (
                  <div className="h-full overflow-y-auto">
                    <CreditNoteDetail
                      creditNote={currentSelectedCreditNote}
                      onClose={handleCloseDetail}
                      onEdit={() => {
                        setIsFormOpen(true);
                      }}
                      onDelete={() => {
                        void handleDeleteCreditNote();
                      }}
                      onPrint={handlePrintCreditNote}
                      onShare={handleDownloadCreditNote}
                    />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <FileText className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">
                      Select a credit note to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Credit Note Form Modal - Placeholder */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="md">
        <ModalContent>
          <ModalHeader onClose={handleCloseForm}>New Credit Note</ModalHeader>
          <ModalBody>
            <p className="text-slate-600">
              Credit note creation form will be implemented here. For now,
              credit notes can be created from the invoice detail page.
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
