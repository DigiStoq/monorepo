import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ConfirmDeleteDialog,
} from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { PaymentInList, PaymentInDetail, PaymentInForm } from "./components";
import { usePaymentIns, usePaymentInMutations } from "@/hooks/usePaymentIns";
import { useSaleInvoices } from "@/hooks/useSaleInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import type { PaymentIn, PaymentInFormData, PaymentMode } from "./types";
import { SearchInput, Select, type SelectOption } from "@/components/ui";
import { Wallet, Banknote, Building2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export function PaymentInPage(): React.ReactNode {
  // Data from PowerSync
  const { payments, isLoading, error } = usePaymentIns();
  const { customers } = useCustomers({ type: "customer" });
  const { invoices } = useSaleInvoices({ status: "partial" });
  const { createPayment, deletePayment } = usePaymentInMutations();

  // State
  const [selectedPayment, setSelectedPayment] = useState<PaymentIn | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  interface PaymentFilters {
    search: string;
    paymentMode: PaymentMode | "all";
    sortBy: "date" | "amount" | "customer";
    sortOrder: "asc" | "desc";
  }

  // Filter State
  const [filters, setFilters] = useState<PaymentFilters>({
    search: "",
    paymentMode: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  const paymentModeOptions: SelectOption[] = [
    { value: "all", label: "All Modes" },
    { value: "cash", label: "Cash" },
    { value: "bank", label: "Bank Transfer" },
    { value: "card", label: "Card" },
    { value: "ach", label: "ACH Transfer" },
    { value: "cheque", label: "Cheque" },
    { value: "other", label: "Other" },
  ];

  // Filter Logic
  const filteredPayments = useMemo(() => {
    return payments
      .filter((payment) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesNumber = payment.receiptNumber
            .toLowerCase()
            .includes(searchLower);
          const matchesCustomer = payment.customerName
            .toLowerCase()
            .includes(searchLower);
          const matchesRef =
            payment.referenceNumber?.toLowerCase().includes(searchLower) ??
            false;
          if (!matchesNumber && !matchesCustomer && !matchesRef) return false;
        }

        // Payment mode filter
        if (
          filters.paymentMode !== "all" &&
          payment.paymentMode !== filters.paymentMode
        ) {
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
            comparison = b.amount - a.amount;
            break;
          case "customer":
            comparison = a.customerName.localeCompare(b.customerName);
            break;
        }

        return filters.sortOrder === "desc" ? comparison : -comparison;
      });
  }, [payments, filters]);

  // Totals Calculation
  const totals = useMemo(() => {
    if (!filteredPayments.length)
      return { total: 0, cash: 0, bank: 0, other: 0 };

    return filteredPayments.reduce(
      (acc, payment) => {
        acc.total += payment.amount;
        if (payment.paymentMode === "cash") {
          acc.cash += payment.amount;
        } else if (payment.paymentMode === "bank") {
          acc.bank += payment.amount;
        } else {
          acc.other += payment.amount;
        }
        return acc;
      },
      { total: 0, cash: 0, bank: 0, other: 0 }
    );
  }, [filteredPayments]);

  const { formatCurrency } = useCurrency();

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentIn | null>(
    null
  );

  // Update selected payment when data changes
  const currentSelectedPayment = useMemo(() => {
    if (!selectedPayment) return null;
    return payments.find((p) => p.id === selectedPayment.id) ?? null;
  }, [payments, selectedPayment]);

  // Handlers
  const handlePaymentClick = (payment: PaymentIn): void => {
    setSelectedPayment(payment);
  };

  const handleCloseDetail = (): void => {
    setSelectedPayment(null);
  };

  const handleRecordPayment = (): void => {
    setIsFormOpen(true);
  };

  const handleCloseForm = (): void => {
    setIsFormOpen(false);
  };

  const handleSubmitPayment = async (
    data: PaymentInFormData
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      const customer = customers.find((c) => c.id === data.customerId);
      const invoice = invoices.find((i) => i.id === data.invoiceId);
      await createPayment({
        receiptNumber: `REC-${Date.now()}`,
        customerId: data.customerId,
        customerName: customer?.name ?? "Unknown",
        date: data.date,
        amount: data.amount,
        paymentMode: data.paymentMode,
        referenceNumber: data.referenceNumber,
        invoiceId: data.invoiceId,
        invoiceNumber: invoice?.invoiceNumber,
        notes: data.notes,
      });
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to record payment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (): void => {
    if (currentSelectedPayment) {
      setPaymentToDelete(currentSelectedPayment);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (paymentToDelete) {
      setIsSubmitting(true);
      try {
        await deletePayment(paymentToDelete.id);
        setSelectedPayment(null);
        setIsDeleteModalOpen(false);
        setPaymentToDelete(null);
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
        title="Payment In"
        description="Track payments received from customers"
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleRecordPayment}
          >
            Record Payment
          </Button>
        }
      />

      {/* Filters Header - Full Width */}
      <div className="bg-card border-b border-border-primary px-6 py-4">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <SearchInput
              placeholder="Search payments..."
              value={filters.search}
              onChange={(e) => {
                setFilters((f) => ({ ...f, search: e.target.value }));
              }}
              className="w-full sm:w-72"
            />

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Select
                options={paymentModeOptions}
                value={filters.paymentMode}
                onChange={(value) => {
                  setFilters((f) => ({
                    ...f,
                    paymentMode: value as PaymentMode | "all",
                  }));
                }}
                size="md"
                className="min-w-[140px]"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 border-t xl:border-t-0 pt-4 xl:pt-0 border-slate-100">
            <div className="flex items-center gap-3 px-4 py-2 bg-subtle rounded-lg border border-border-primary whitespace-nowrap">
              <div className="p-1.5 bg-card rounded-md shadow-sm">
                <Wallet className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Total Received
                </p>
                <p className="text-lg font-bold text-slate-900 leading-none">
                  {formatCurrency(totals.total)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-green-50 rounded-lg border border-green-100 whitespace-nowrap">
              <div className="p-1.5 bg-card rounded-md shadow-sm">
                <Banknote className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium uppercase tracking-wider">
                  Cash
                </p>
                <p className="text-lg font-bold text-green-700 leading-none">
                  {formatCurrency(totals.cash)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100 whitespace-nowrap">
              <div className="p-1.5 bg-card rounded-md shadow-sm">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">
                  Bank
                </p>
                <p className="text-lg font-bold text-blue-700 leading-none">
                  {formatCurrency(totals.bank)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-app">
        {/* Payment List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto flex gap-4">
              <div className="w-full max-w-[420px] shrink-0 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2">
                  <PaymentInList
                    payments={filteredPayments}
                    onPaymentClick={handlePaymentClick}
                    onRecordPayment={handleRecordPayment}
                    hasActiveFilters={
                      !!filters.search || filters.paymentMode !== "all"
                    }
                  />
                </div>
              </div>

              {/* Detail View */}
              <div className="flex-1 overflow-hidden bg-card rounded-lg border border-border-primary shadow-sm">
                {currentSelectedPayment ? (
                  <div className="h-full overflow-y-auto">
                    <PaymentInDetail
                      payment={currentSelectedPayment}
                      onClose={handleCloseDetail}
                      onEdit={() => {
                        setIsFormOpen(true);
                      }}
                      onDelete={handleDeleteClick}
                      onPrint={() => {
                        /* TODO: Implement print */
                      }}
                      onShare={() => {
                        /* TODO: Implement share */
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Wallet className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">
                      Select a payment to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="xl">
        <ModalContent>
          <ModalHeader onClose={handleCloseForm}>Record Payment</ModalHeader>
          <ModalBody className="p-0">
            <PaymentInForm
              customers={customers}
              invoices={invoices}
              onSubmit={(data) => {
                void handleSubmitPayment(data);
              }}
              onCancel={handleCloseForm}
              className="p-6"
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPaymentToDelete(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        title="Delete Payment"
        itemName={paymentToDelete?.receiptNumber ?? ""}
        itemType="Payment"
        warningMessage={
          paymentToDelete?.invoiceId
            ? "This will delete the payment and reverse the balance on the linked invoice."
            : "This will permanently delete this payment record and reverse the customer balance."
        }
        linkedItems={
          paymentToDelete?.invoiceId
            ? [
              {
                type: "Invoice Link",
                count: 1,
                description: "Balance will be reversed",
              },
            ]
            : undefined
        }
        isLoading={isSubmitting}
      />
    </div>
  );
}
