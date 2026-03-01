import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
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
import { EstimateList, EstimateDetail, EstimateForm } from "./components";
import {
  useEstimates,
  useEstimateById,
  useEstimateMutations,
} from "@/hooks/useEstimates";
import { useCustomers } from "@/hooks/useCustomers";
import { useItems } from "@/hooks/useItems";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import type { Estimate, EstimateFormData, EstimateStatus } from "./types";
import { SearchInput, Select, type SelectOption } from "@/components/ui";
import { CheckCircle, Clock, DollarSign, FileText } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";

export function EstimatesPage(): React.ReactNode {
  const navigate = useNavigate();

  // Data from PowerSync
  const { estimates, isLoading, error } = useEstimates();
  const { customers } = useCustomers({ type: "customer" });
  const { items } = useItems({ isActive: true });
  const {
    createEstimate,
    updateEstimateStatus,
    convertEstimateToInvoice,
    deleteEstimate,
  } = useEstimateMutations();

  // PDF Generator
  const {
    downloadEstimate,
    printEstimate,
    isReady: pdfReady,
  } = usePDFGenerator();

  // State
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  interface EstimateFilters {
    search: string;
    status: EstimateStatus | "all";
    sortBy: "date" | "validUntil" | "amount" | "customer";
    sortOrder: "asc" | "desc";
  }

  // Filter State
  const [filters, setFilters] = useState<EstimateFilters>({
    search: "",
    status: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  const statusOptions: SelectOption[] = [
    { value: "all", label: "All Status" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
    { value: "expired", label: "Expired" },
    { value: "converted", label: "Converted" },
  ];

  // Filter Logic
  const filteredEstimates = useMemo(() => {
    return estimates
      .filter((estimate) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesNumber = estimate.estimateNumber
            .toLowerCase()
            .includes(searchLower);
          const matchesCustomer = estimate.customerName
            .toLowerCase()
            .includes(searchLower);
          if (!matchesNumber && !matchesCustomer) return false;
        }

        // Status filter
        if (filters.status !== "all" && estimate.status !== filters.status) {
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
          case "validUntil":
            comparison =
              new Date(b.validUntil).getTime() -
              new Date(a.validUntil).getTime();
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
  }, [estimates, filters]);

  // Totals Calculation
  const totals = useMemo(() => {
    if (!filteredEstimates.length)
      return { total: 0, pending: 0, accepted: 0, converted: 0 };

    return filteredEstimates.reduce(
      (acc, est) => {
        acc.total += est.total;
        if (est.status === "sent") {
          acc.pending += est.total;
        } else if (est.status === "accepted") {
          acc.accepted += est.total;
        } else if (est.status === "converted") {
          acc.converted += est.total;
        }
        return acc;
      },
      { total: 0, pending: 0, accepted: 0, converted: 0 }
    );
  }, [filteredEstimates]);

  const { formatCurrency } = useCurrency();

  // Fetch full estimate with items when one is selected
  const { estimate: selectedEstimateData, items: selectedEstimateItems } =
    useEstimateById(selectedEstimateId);

  // Combine estimate with its items for the detail component
  const currentSelectedEstimate = useMemo(() => {
    if (!selectedEstimateData) return null;
    return {
      ...selectedEstimateData,
      items: selectedEstimateItems,
    };
  }, [selectedEstimateData, selectedEstimateItems]);

  // Handlers
  const handleEstimateClick = (estimate: Estimate): void => {
    setSelectedEstimateId(estimate.id);
  };

  const handleCloseDetail = (): void => {
    setSelectedEstimateId(null);
  };

  const handleCreateEstimate = (): void => {
    setIsFormOpen(true);
  };

  const handleCloseForm = (): void => {
    setIsFormOpen(false);
  };

  const handleSubmitEstimate = async (
    data: EstimateFormData
  ): Promise<void> => {
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
      const subtotal = estimateItems.reduce(
        (sum, item) => sum + item.amount,
        0
      );
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
      toast.success("Estimate created successfully");
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to create estimate:", err);
      toast.error("Failed to create estimate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEstimate = async (): Promise<void> => {
    if (currentSelectedEstimate) {
      try {
        await updateEstimateStatus(currentSelectedEstimate.id, "sent");
        toast.success("Estimate marked as sent");
      } catch (err) {
        console.error("Failed to send estimate:", err);
        toast.error("Failed to update estimate status");
      }
    }
  };

  const handleMarkAccepted = async (): Promise<void> => {
    if (currentSelectedEstimate) {
      try {
        await updateEstimateStatus(currentSelectedEstimate.id, "accepted");
        toast.success("Estimate marked as accepted");
      } catch (err) {
        console.error("Failed to update estimate:", err);
        toast.error("Failed to update estimate status");
      }
    }
  };

  const handleMarkRejected = async (): Promise<void> => {
    if (currentSelectedEstimate) {
      try {
        await updateEstimateStatus(currentSelectedEstimate.id, "rejected");
        toast.success("Estimate marked as rejected");
      } catch (err) {
        console.error("Failed to update estimate:", err);
        toast.error("Failed to update estimate status");
      }
    }
  };

  const handleConvertToInvoice = async (): Promise<void> => {
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
        toast.success("Estimate converted to invoice");
        void navigate({ to: "/sale/invoices" });
      } catch (err) {
        console.error("Failed to convert estimate to invoice:", err);
        toast.error("Failed to convert estimate to invoice");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // PDF handlers
  const handlePrintEstimate = (): void => {
    if (currentSelectedEstimate && pdfReady) {
      const customer = customers.find(
        (c) => c.id === currentSelectedEstimate.customerId
      );
      printEstimate(currentSelectedEstimate, customer);
    }
  };

  const handleDownloadEstimate = (): void => {
    if (currentSelectedEstimate && pdfReady) {
      const customer = customers.find(
        (c) => c.id === currentSelectedEstimate.customerId
      );
      downloadEstimate(currentSelectedEstimate, customer);
    }
  };

  const handleDeleteEstimate = async (): Promise<void> => {
    if (currentSelectedEstimate) {
      setIsSubmitting(true);
      try {
        await deleteEstimate(currentSelectedEstimate.id);
        toast.success("Estimate deleted successfully");
        setSelectedEstimateId(null);
      } catch (err) {
        console.error("Failed to delete estimate:", err);
        toast.error("Failed to delete estimate");
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
          <p className="text-text-tertiary text-sm">{error.message}</p>
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
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleCreateEstimate}
          >
            New Estimate
          </Button>
        }
      />

      {/* Filters Header - Full Width */}
      <div className="bg-card border-b border-border-primary px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <SearchInput
              placeholder="Search estimates..."
              value={filters.search}
              onChange={(e) => {
                setFilters((f) => ({ ...f, search: e.target.value }));
              }}
              className="w-full sm:w-72"
            />

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Select
                options={statusOptions}
                value={filters.status}
                onChange={(value) => {
                  setFilters((f) => ({
                    ...f,
                    status: value as EstimateStatus | "all",
                  }));
                }}
                size="md"
                className="min-w-[140px]"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-border-primary">
            <div className="flex items-center gap-3 px-4 py-2 bg-subtle rounded-lg border border-border-primary whitespace-nowrap">
              <div className="p-1.5 bg-card rounded-md shadow-sm">
                <DollarSign className="h-4 w-4 text-text-tertiary" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary font-medium uppercase tracking-wider">
                  Total Value
                </p>
                <p className="text-lg font-bold text-text-primary leading-none">
                  {formatCurrency(totals.total)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-blue-100 whitespace-nowrap">
              <div className="p-1.5 bg-card rounded-md shadow-sm">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">
                  Pending
                </p>
                <p className="text-lg font-bold text-blue-700 leading-none">
                  {formatCurrency(totals.pending)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-success-light rounded-lg border border-success/20 whitespace-nowrap">
              <div className="p-1.5 bg-card rounded-md shadow-sm">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-success-dark font-medium uppercase tracking-wider">
                  Accepted
                </p>
                <p className="text-lg font-bold text-success leading-none">
                  {formatCurrency(totals.accepted)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-app">
        {/* Estimate List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto flex gap-4">
              <div className="w-full max-w-[420px] shrink-0 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2">
                  <EstimateList
                    estimates={filteredEstimates}
                    onEstimateClick={handleEstimateClick}
                    onCreateEstimate={handleCreateEstimate}
                    hasActiveFilters={
                      !!filters.search || filters.status !== "all"
                    }
                  />
                </div>
              </div>

              {/* Detail - Showing Placeholder or Selected */}
              <div className="flex-1 overflow-hidden bg-card rounded-lg border border-border-primary shadow-sm">
                {currentSelectedEstimate ? (
                  <div className="h-full overflow-y-auto">
                    <EstimateDetail
                      estimate={currentSelectedEstimate}
                      onClose={handleCloseDetail}
                      onEdit={() => {
                        setIsFormOpen(true);
                      }}
                      onDelete={() => {
                        void handleDeleteEstimate();
                      }}
                      onPrint={handlePrintEstimate}
                      onShare={handleDownloadEstimate}
                      onSend={() => {
                        void handleSendEstimate();
                      }}
                      onMarkAccepted={() => {
                        void handleMarkAccepted();
                      }}
                      onMarkRejected={() => {
                        void handleMarkRejected();
                      }}
                      onConvertToInvoice={() => {
                        void handleConvertToInvoice();
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-text-muted">
                    <FileText className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">
                      Select an estimate to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estimate Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="xl">
        <ModalContent>
          <ModalHeader onClose={handleCloseForm}>New Estimate</ModalHeader>
          <ModalBody className="p-0">
            <EstimateForm
              customers={customers}
              items={items}
              onSubmit={(data) => {
                void handleSubmitEstimate(data);
              }}
              onCancel={handleCloseForm}
              className="p-6"
              isLoading={isSubmitting}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
