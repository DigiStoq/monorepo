import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  DateInput,
  Select,
  ConfirmDeleteDialog,
  type SelectOption,
} from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus, DollarSign } from "lucide-react";
import {
  PurchaseInvoiceList,
  PurchaseInvoiceDetail,
  PurchaseInvoiceForm,
} from "./components";
import {
  usePurchaseInvoices,
  usePurchaseInvoiceMutations,
  usePurchaseInvoiceLinkedItems,
  usePurchaseInvoiceItems,
} from "@/hooks/usePurchaseInvoices";
import { usePaymentOutMutations } from "@/hooks/usePaymentOuts";
import { useCashTransactionMutations } from "@/hooks/useCashTransactions";
import { useBankTransactionMutations } from "@/hooks/useBankTransactions";
import {
  useBankAccounts,
  useBankAccountMutations,
} from "@/hooks/useBankAccounts";
import { useChequeMutations } from "@/hooks/useCheques";
import { useCustomers } from "@/hooks/useCustomers";
import { useItems } from "@/hooks/useItems";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import type {
  PurchaseInvoice,
  PurchaseInvoiceFormData,
  PurchaseInvoiceStatus,
  PaymentOutMode,
} from "./types";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";

export function PurchaseInvoicesPage(): React.ReactNode {
  // Data from PowerSync
  const { invoices, isLoading, error } = usePurchaseInvoices();
  const { customers } = useCustomers({ type: "supplier" });
  const { items } = useItems({ isActive: true });
  const { accounts: bankAccounts } = useBankAccounts({ isActive: true });
  const { createInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus } =
    usePurchaseInvoiceMutations();
  const { createPayment } = usePaymentOutMutations();
  const { createTransaction: createCashTransaction } =
    useCashTransactionMutations();
  const { createTransaction: createBankTransaction } =
    useBankTransactionMutations();
  const { createCheque } = useChequeMutations();
  const { createAccount: createBankAccount } = useBankAccountMutations();

  // PDF Generator
  const {
    printPurchaseInvoice,
    downloadPurchaseInvoice,
    isReady: pdfReady,
  } = usePDFGenerator();

  // State
  const [selectedPurchase, setSelectedPurchase] =
    useState<PurchaseInvoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] =
    useState<PurchaseInvoice | null>(null);
  const [restoreStock, setRestoreStock] = useState(false);
  const linkedItems = usePurchaseInvoiceLinkedItems(
    invoiceToDelete?.id ?? null
  );

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentOutMode>("cash");
  const [selectedBankAccountId, setSelectedBankAccountId] =
    useState<string>("");

  // Cheque details state
  const [chequeNumber, setChequeNumber] = useState<string>("");
  const [chequeBankName, setChequeBankName] = useState<string>("");
  const [chequeDueDate, setChequeDueDate] = useState<string>("");

  // New bank account form state
  const [isAddingBankAccount, setIsAddingBankAccount] = useState(false);
  const [newBankAccountName, setNewBankAccountName] = useState<string>("");
  const [newBankName, setNewBankName] = useState<string>("");
  const [newBankAccountNumber, setNewBankAccountNumber] = useState<string>("");

  // Workflow modals state
  const [isOrderedModalOpen, setIsOrderedModalOpen] = useState(false);
  const [isReceivedModalOpen, setIsReceivedModalOpen] = useState(false);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>("");
  const [isPaidOnReceipt, setIsPaidOnReceipt] = useState(false);

  // Payment mode options
  const paymentModeOptions: SelectOption[] = [
    { value: "cash", label: "Cash" },
    { value: "bank", label: "Bank Transfer" },
    { value: "cheque", label: "Cheque" },
  ];

  // Bank account options for dropdown
  const bankAccountOptions: SelectOption[] = useMemo(
    () =>
      bankAccounts.map((account) => ({
        value: account.id,
        label: `${account.name} - ${account.bankName}`,
      })),
    [bankAccounts]
  );

  // Update selected purchase when data changes
  const selectedInvoiceFromList = useMemo(() => {
    if (!selectedPurchase) return null;
    return invoices.find((p) => p.id === selectedPurchase.id) ?? null;
  }, [invoices, selectedPurchase]);

  const { items: invoiceItems } = usePurchaseInvoiceItems(
    selectedInvoiceFromList?.id
  );

  const currentSelectedPurchase = useMemo(() => {
    if (!selectedInvoiceFromList) return null;
    return {
      ...selectedInvoiceFromList,
      items: invoiceItems,
    };
  }, [selectedInvoiceFromList, invoiceItems]);

  // Derived initial data for edit form
  const formInitialData = useMemo<
    Partial<PurchaseInvoiceFormData> | undefined
  >(() => {
    if (!currentSelectedPurchase) return undefined;

    // Calculate discount percent from amount if possible
    const subtotal = currentSelectedPurchase.subtotal;
    const discountAmount = currentSelectedPurchase.discountAmount;
    const discountPercent =
      subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;

    return {
      invoiceNumber: currentSelectedPurchase.invoiceNumber,
      supplierInvoiceNumber: currentSelectedPurchase.supplierInvoiceNumber,
      customerId: currentSelectedPurchase.customerId,
      date: currentSelectedPurchase.date,
      dueDate: currentSelectedPurchase.dueDate,
      discountPercent: Number(discountPercent.toFixed(2)),
      notes: currentSelectedPurchase.notes ?? undefined,
      items: currentSelectedPurchase.items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
      })),
    };
  }, [currentSelectedPurchase]);

  // Handlers
  const handlePurchaseClick = (purchase: PurchaseInvoice): void => {
    setSelectedPurchase(purchase);
  };

  const handleCloseDetail = (): void => {
    setSelectedPurchase(null);
  };

  const handleCreatePurchase = (): void => {
    // Clear selection so we start fresh (no initial data)
    setSelectedPurchase(null);
    setIsFormOpen(true);
  };

  const handleEditPurchase = (): void => {
    // currentSelectedPurchase is already set, just open form
    setIsFormOpen(true);
  };

  const handleCloseForm = (): void => {
    setIsFormOpen(false);
  };

  const handleSubmitPurchase = async (
    data: PurchaseInvoiceFormData
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
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
      const subtotal = purchaseItems.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const discountAmount = subtotal * ((data.discountPercent ?? 0) / 100);

      if (currentSelectedPurchase) {
        // UPDATE
        await updateInvoice(
          currentSelectedPurchase.id,
          {
            invoiceNumber: currentSelectedPurchase.invoiceNumber,
            supplierInvoiceNumber: data.supplierInvoiceNumber,
            supplierId: data.customerId,
            supplierName,
            date: data.date,
            dueDate: data.dueDate ?? data.date,
            status: currentSelectedPurchase.status, // Keep existing status
            discountAmount,
            notes: data.notes,
          },
          purchaseItems
        );
        toast.success("Purchase invoice updated successfully");
      } else {
        // CREATE
        // Generate invoice number
        const invoiceNumber = `PUR-${Date.now()}`;

        await createInvoice(
          {
            invoiceNumber,
            ...(data.supplierInvoiceNumber && {
              supplierInvoiceNumber: data.supplierInvoiceNumber,
            }),
            supplierId: data.customerId,
            supplierName,
            date: data.date,
            dueDate: data.dueDate ?? data.date,
            status: "draft",
            discountAmount,
            ...(data.notes && { notes: data.notes }),
            initialPaymentStatus: data.initialPaymentStatus,
            initialAmountPaid: data.initialAmountPaid,
            initialPaymentMode: data.initialPaymentMode,
            initialBankAccountId: data.initialBankAccountId,
            initialChequeNumber: data.initialChequeNumber,
            initialChequeBankName: data.initialChequeBankName,
            initialChequeDueDate: data.initialChequeDueDate,
          },
          purchaseItems
        );
      }
      toast.success("Purchase invoice created successfully");
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to save purchase invoice:", err);
      toast.error("Failed to save purchase invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  interface PurchaseFilters {
    search: string;
    status: PurchaseInvoiceStatus | "all";
    customerId: string;
    dateRange: { from: Date | null; to: Date | null };
    sortBy: "date" | "number" | "amount" | "supplier";
    sortOrder: "asc" | "desc";
  }

  // State
  const [filters, setFilters] = useState<PurchaseFilters>({
    search: "",
    status: "all",
    customerId: "all",
    dateRange: { from: null, to: null },
    sortBy: "date",
    sortOrder: "desc",
  });

  const statusOptions: SelectOption[] = [
    { value: "all", label: "All Status" },
    { value: "draft", label: "Draft" },
    { value: "ordered", label: "Ordered" },
    { value: "received", label: "Received" },
    { value: "paid", label: "Paid" },
    { value: "returned", label: "Returned" },
  ];

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((invoice) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesNumber = invoice.invoiceNumber
            .toLowerCase()
            .includes(searchLower);
          const matchesSupplier = invoice.customerName
            .toLowerCase()
            .includes(searchLower);
          const matchesSupplierRef = invoice.supplierInvoiceNumber
            ?.toLowerCase()
            .includes(searchLower);
          if (!matchesNumber && !matchesSupplier && !matchesSupplierRef)
            return false;
        }

        // Status filter
        if (filters.status !== "all" && invoice.status !== filters.status) {
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
          case "number":
            comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
            break;
          case "amount":
            comparison = b.total - a.total;
            break;
          case "supplier":
            comparison = a.customerName.localeCompare(b.customerName);
            break;
        }

        return filters.sortOrder === "desc" ? comparison : -comparison;
      });
  }, [invoices, filters]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredInvoices.length)
      return { total: 0, paid: 0, pending: 0, returned: 0 };

    return filteredInvoices.reduce(
      (acc, inv) => {
        acc.total += inv.total;
        acc.paid += inv.amountPaid;
        if (inv.status === "returned") {
          acc.returned += inv.total;
        } else if (inv.amountDue > 0) {
          acc.pending += inv.amountDue;
        }
        return acc;
      },
      { total: 0, paid: 0, pending: 0, returned: 0 }
    );
  }, [filteredInvoices]);

  const { formatCurrency } = useCurrency();

  const handleDeleteClick = (): void => {
    if (currentSelectedPurchase) {
      setInvoiceToDelete(currentSelectedPurchase);
      setRestoreStock(false);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (invoiceToDelete) {
      setIsSubmitting(true);
      try {
        await deleteInvoice(invoiceToDelete.id, restoreStock);
        setSelectedPurchase(null);
        setIsDeleteModalOpen(false);
        setInvoiceToDelete(null);
        toast.success("Purchase invoice deleted successfully");
      } catch (err) {
        console.error("Failed to delete purchase invoice:", err);
        toast.error("Failed to delete purchase invoice");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRecordPayment = (): void => {
    if (currentSelectedPurchase) {
      setPaymentAmount(currentSelectedPurchase.amountDue.toFixed(2));
      setPaymentMode("cash");
      setSelectedBankAccountId(bankAccounts[0]?.id ?? "");
      // Reset cheque fields
      setChequeNumber("");
      setChequeBankName("");
      setChequeDueDate(new Date().toISOString().slice(0, 10));
      // Reset bank account form
      setIsAddingBankAccount(false);
      setNewBankAccountName("");
      setNewBankName("");
      setNewBankAccountNumber("");
      setIsPaymentModalOpen(true);
    }
  };

  const handleStatusChange = async (
    newStatus: PurchaseInvoiceStatus
  ): Promise<void> => {
    if (
      currentSelectedPurchase &&
      newStatus !== currentSelectedPurchase.status
    ) {
      if (newStatus === "ordered") {
        setExpectedDeliveryDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
        ); // Default +7 days
        setIsOrderedModalOpen(true);
        return;
      }

      if (newStatus === "received") {
        setIsPaidOnReceipt(false);
        setIsReceivedModalOpen(true);
        return;
      }

      try {
        await updateInvoiceStatus(currentSelectedPurchase.id, newStatus);
        toast.success(`Status updated to ${newStatus}`);
      } catch (err) {
        console.error("Failed to update status:", err);
        toast.error("Failed to update status");
      }
    }
  };

  const handleConfirmOrder = async (): Promise<void> => {
    if (!currentSelectedPurchase) return;

    try {
      await updateInvoiceStatus(currentSelectedPurchase.id, "ordered", {
        expectedDeliveryDate,
      });
      toast.success("Order confirmed");
      setIsOrderedModalOpen(false);
    } catch (err) {
      console.error("Failed to confirm order:", err);
      toast.error("Failed to confirm order");
    }
  };

  const handleConfirmReceipt = async (): Promise<void> => {
    if (!currentSelectedPurchase) return;

    try {
      await updateInvoiceStatus(currentSelectedPurchase.id, "received");
      toast.success("Receipt confirmed");
      setIsReceivedModalOpen(false);

      if (isPaidOnReceipt) {
        // Prepare and open payment modal
        handleRecordPayment();
      }
    } catch (err) {
      console.error("Failed to confirm receipt:", err);
      toast.error("Failed to confirm receipt");
    }
  };

  const handleAddBankAccount = async (): Promise<void> => {
    if (!newBankAccountName || !newBankName || !newBankAccountNumber) return;

    try {
      const newAccountId = await createBankAccount({
        name: newBankAccountName,
        bankName: newBankName,
        accountNumber: newBankAccountNumber,
        accountType: "savings",
        openingBalance: 0,
      });
      // Select the newly created account
      setSelectedBankAccountId(newAccountId);
      // Reset and hide the form
      setIsAddingBankAccount(false);
      setNewBankAccountName("");
      setNewBankName("");
      setNewBankAccountNumber("");
      toast.success("Bank account created successfully");
    } catch (err) {
      console.error("Failed to create bank account:", err);
      toast.error("Failed to create bank account");
    }
  };

  const handleConfirmPayment = async (): Promise<void> => {
    // Prevent double submission
    if (isSubmitting) return;

    if (currentSelectedPurchase && paymentAmount) {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) return;

      // Prevent overpayment
      if (amount > currentSelectedPurchase.amountDue) {
        console.warn("Payment amount exceeds amount due");
        return;
      }

      // Validate bank account selection for bank payments
      if (paymentMode === "bank" && !selectedBankAccountId) {
        return;
      }

      // Validate cheque fields for cheque payments
      if (
        paymentMode === "cheque" &&
        (!chequeNumber || !chequeBankName || !chequeDueDate)
      ) {
        return;
      }

      setIsSubmitting(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const paymentNumber = `PAY-${Date.now()}`;

        // 1. Create Payment Out record (this also updates the invoice)
        await createPayment({
          paymentNumber,
          supplierId: currentSelectedPurchase.customerId,
          supplierName: currentSelectedPurchase.customerName,
          date: today,
          amount,
          paymentMode,
          invoiceId: currentSelectedPurchase.id,
          invoiceNumber: currentSelectedPurchase.invoiceNumber,
        });

        // 2. Create corresponding transaction based on payment mode
        if (paymentMode === "cash") {
          await createCashTransaction({
            date: today,
            type: "out",
            amount,
            description: `Payment for ${currentSelectedPurchase.invoiceNumber}`,
            category: "Supplier Payment",
            relatedCustomerId: currentSelectedPurchase.customerId,
            relatedCustomerName: currentSelectedPurchase.customerName,
            relatedInvoiceId: currentSelectedPurchase.id,
            relatedInvoiceNumber: currentSelectedPurchase.invoiceNumber,
          });
        } else if (paymentMode === "bank") {
          await createBankTransaction({
            accountId: selectedBankAccountId,
            date: today,
            type: "withdrawal",
            amount,
            description: `Payment for ${currentSelectedPurchase.invoiceNumber}`,
            relatedCustomerId: currentSelectedPurchase.customerId,
            relatedCustomerName: currentSelectedPurchase.customerName,
            relatedInvoiceId: currentSelectedPurchase.id,
            relatedInvoiceNumber: currentSelectedPurchase.invoiceNumber,
          });
        } else if (paymentMode === "cheque") {
          // Create cheque record for tracking
          await createCheque({
            chequeNumber,
            type: "issued",
            customerId: currentSelectedPurchase.customerId,
            customerName: currentSelectedPurchase.customerName,
            bankName: chequeBankName,
            date: today,
            dueDate: chequeDueDate,
            amount,
            relatedInvoiceId: currentSelectedPurchase.id,
            relatedInvoiceNumber: currentSelectedPurchase.invoiceNumber,
          });
        }

        setIsPaymentModalOpen(false);
        setPaymentAmount("");
        setSelectedBankAccountId("");
        setChequeNumber("");
        setChequeBankName("");
        setChequeBankName("");
        setChequeDueDate("");
        toast.success("Payment recorded successfully");
      } catch (err) {
        console.error("Failed to record payment:", err);
        toast.error("Failed to record payment");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // PDF handlers
  const handleDownloadPurchase = (): void => {
    if (currentSelectedPurchase && pdfReady) {
      const supplier = customers.find(
        (c) => c.id === currentSelectedPurchase.customerId
      );
      downloadPurchaseInvoice(currentSelectedPurchase, supplier);
    }
  };

  const handlePrintPurchase = (): void => {
    if (currentSelectedPurchase && pdfReady) {
      // Note: suppliers are stored in customers table with customerId
      const supplier = customers.find(
        (c) => c.id === currentSelectedPurchase.customerId
      );
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
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleCreatePurchase}
          >
            New Purchase
          </Button>
        }
      />

      {/* Filters Header - Full Width */}
      <div className="bg-card border-b border-border-primary px-6 py-4">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <Input
              placeholder="Search purchases..."
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
                    status: value as PurchaseInvoiceStatus | "all",
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
                <DollarSign className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Total
                </p>
                <p className="text-lg font-bold text-slate-900 leading-none">
                  {formatCurrency(totals.total)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-success-light rounded-lg border border-success/20 whitespace-nowrap">
              <div className="p-1.5 bg-card rounded-md shadow-sm">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-success-dark font-medium uppercase tracking-wider">
                  Paid
                </p>
                <p className="text-lg font-bold text-success leading-none">
                  {formatCurrency(totals.paid)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-warning-light rounded-lg border border-warning/20 whitespace-nowrap">
              <div className="p-1.5 bg-card rounded-md shadow-sm">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-warning-dark font-medium uppercase tracking-wider">
                  Pending
                </p>
                <p className="text-lg font-bold text-warning-dark leading-none">
                  {formatCurrency(totals.pending)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-error-light rounded-lg border border-error/20 whitespace-nowrap">
              <div className="p-1.5 bg-card rounded-md shadow-sm">
                <XCircle className="h-4 w-4 text-error" />
              </div>
              <div>
                <p className="text-xs text-error-dark font-medium uppercase tracking-wider">
                  Returned
                </p>
                <p className="text-lg font-bold text-error leading-none">
                  {formatCurrency(totals.returned)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-app">
        {/* Purchase List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto flex gap-4">
              <div className="w-full max-w-[420px] shrink-0 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2">
                  <PurchaseInvoiceList
                    invoices={filteredInvoices}
                    onInvoiceClick={handlePurchaseClick}
                    onCreateInvoice={handleCreatePurchase}
                    hasActiveFilters={
                      !!filters.search || filters.status !== "all"
                    }
                  />
                </div>
              </div>

              {/* Detail View */}
              <div className="flex-1 overflow-hidden bg-card rounded-lg border border-border-primary shadow-sm">
                {currentSelectedPurchase ? (
                  <div className="h-full overflow-y-auto">
                    <PurchaseInvoiceDetail
                      invoice={currentSelectedPurchase}
                      onClose={handleCloseDetail}
                      onEdit={handleEditPurchase}
                      onDelete={handleDeleteClick}
                      onDownload={handleDownloadPurchase}
                      onPrint={handlePrintPurchase}
                      onRecordPayment={handleRecordPayment}
                      onStatusChange={(status) => {
                        void handleStatusChange(status);
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <DollarSign className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">
                      Select a purchase to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="full">
        <ModalContent className="max-w-6xl mx-auto my-4 h-[calc(100vh-2rem)]">
          <ModalHeader onClose={handleCloseForm}>
            {currentSelectedPurchase
              ? "Edit Purchase Invoice"
              : "New Purchase Invoice"}
          </ModalHeader>
          <ModalBody className="p-0 overflow-y-auto">
            <PurchaseInvoiceForm
              key={currentSelectedPurchase?.id ?? "new"}
              customers={customers}
              items={items}
              bankAccounts={bankAccounts}
              initialData={formInitialData}
              onSubmit={(data) => {
                void handleSubmitPurchase(data);
              }}
              onCancel={handleCloseForm}
              onAddBankAccount={async (data) => {
                return await createBankAccount({
                  ...data,
                  accountType: "savings",
                });
              }}
              className="p-6"
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Confirm Order Modal */}
      <Modal
        isOpen={isOrderedModalOpen}
        onClose={() => {
          setIsOrderedModalOpen(false);
        }}
        size="sm"
      >
        <ModalContent>
          <ModalHeader title="Confirm Order" />
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                When do you expect this order to be received?
              </p>
              <DateInput
                label="Expected Delivery Date"
                value={expectedDeliveryDate}
                onChange={setExpectedDeliveryDate}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsOrderedModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleConfirmOrder();
              }}
            >
              Confirm Order
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirm Receipt Modal */}
      <Modal
        isOpen={isReceivedModalOpen}
        onClose={() => {
          setIsReceivedModalOpen(false);
        }}
        size="sm"
      >
        <ModalContent>
          <ModalHeader title="Confirm Receipt" />
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to mark this order as received? Stocks
                will be updated.
              </p>
              <div className="flex items-center gap-2 p-3 bg-subtle rounded-lg border border-border-primary">
                <input
                  type="checkbox"
                  id="paidCheck"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={isPaidOnReceipt}
                  onChange={(e) => {
                    setIsPaidOnReceipt(e.target.checked);
                  }}
                />
                <label
                  htmlFor="paidCheck"
                  className="text-sm font-medium text-text-heading cursor-pointer"
                >
                  Mark as Paid?
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsReceivedModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleConfirmReceipt();
              }}
            >
              Confirm Receipt
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentAmount("");
          setSelectedBankAccountId("");
          setChequeNumber("");
          setChequeBankName("");
          setChequeDueDate("");
          setIsAddingBankAccount(false);
          setNewBankAccountName("");
          setNewBankName("");
          setNewBankAccountNumber("");
        }}
        size="sm"
      >
        <ModalContent>
          <ModalHeader title="Record Payment" />
          <ModalBody>
            <div className="space-y-4">
              <div className="p-3 bg-subtle rounded-lg">
                <p className="text-sm text-slate-500">Invoice</p>
                <p className="font-semibold text-slate-900">
                  {currentSelectedPurchase?.invoiceNumber}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Amount Due: ${currentSelectedPurchase?.amountDue.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Amount
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  max={currentSelectedPurchase?.amountDue}
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value);
                  }}
                  leftIcon={<DollarSign className="h-4 w-4" />}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Mode
                </label>
                <Select
                  options={paymentModeOptions}
                  value={paymentMode}
                  onChange={(value) => {
                    setPaymentMode(value as PaymentOutMode);
                  }}
                />
              </div>

              {paymentMode === "bank" && (
                <>
                  {!isAddingBankAccount ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-slate-700">
                          Bank Account
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingBankAccount(true);
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add New
                        </button>
                      </div>
                      <Select
                        options={bankAccountOptions}
                        value={selectedBankAccountId}
                        onChange={(value) => {
                          setSelectedBankAccountId(value);
                        }}
                        placeholder="Select bank account"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          Add Bank Account
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingBankAccount(false);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Account Name
                        </label>
                        <Input
                          type="text"
                          value={newBankAccountName}
                          onChange={(e) => {
                            setNewBankAccountName(e.target.value);
                          }}
                          placeholder="e.g., Business Checking"
                          size="sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Bank Name
                        </label>
                        <Input
                          type="text"
                          value={newBankName}
                          onChange={(e) => {
                            setNewBankName(e.target.value);
                          }}
                          placeholder="e.g., Chase Bank"
                          size="sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Account Number
                        </label>
                        <Input
                          type="text"
                          value={newBankAccountNumber}
                          onChange={(e) => {
                            setNewBankAccountNumber(e.target.value);
                          }}
                          placeholder="Enter account number"
                          size="sm"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          void handleAddBankAccount();
                        }}
                        disabled={
                          !newBankAccountName ||
                          !newBankName ||
                          !newBankAccountNumber
                        }
                        fullWidth
                      >
                        Add Account
                      </Button>
                    </div>
                  )}
                </>
              )}

              {paymentMode === "cheque" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Cheque Number
                    </label>
                    <Input
                      type="text"
                      value={chequeNumber}
                      onChange={(e) => {
                        setChequeNumber(e.target.value);
                      }}
                      placeholder="Enter cheque number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <Input
                      type="text"
                      value={chequeBankName}
                      onChange={(e) => {
                        setChequeBankName(e.target.value);
                      }}
                      placeholder="Enter bank name"
                    />
                  </div>
                  <div>
                    <DateInput
                      label="Cheque Date (Due Date)"
                      value={chequeDueDate}
                      onChange={setChequeDueDate}
                    />
                  </div>
                </>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsPaymentModalOpen(false);
                setPaymentAmount("");
                setSelectedBankAccountId("");
                setChequeNumber("");
                setChequeBankName("");
                setChequeDueDate("");
                setIsAddingBankAccount(false);
                setNewBankAccountName("");
                setNewBankName("");
                setNewBankAccountNumber("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleConfirmPayment();
              }}
              isLoading={isSubmitting}
              disabled={
                !paymentAmount ||
                parseFloat(paymentAmount) <= 0 ||
                (paymentMode === "bank" &&
                  (!selectedBankAccountId || isAddingBankAccount)) ||
                (paymentMode === "cheque" &&
                  (!chequeNumber || !chequeBankName || !chequeDueDate))
              }
            >
              Record Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setInvoiceToDelete(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        title="Delete Purchase Invoice"
        itemName={invoiceToDelete?.invoiceNumber ?? ""}
        itemType="Purchase Invoice"
        warningMessage="This will permanently delete the purchase invoice. Balance changes will always be reversed."
        linkedItems={[
          {
            type: "Invoice Item",
            count: linkedItems.itemsCount,
            description: restoreStock
              ? "Stock will be removed"
              : "Stock NOT affected",
          },
          {
            type: "Payment",
            count: linkedItems.paymentsCount,
            description: "Will be deleted",
          },
        ]}
        isLoading={isSubmitting}
      >
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg mt-2">
          <input
            type="checkbox"
            id="restoreStock"
            checked={restoreStock}
            onChange={(e) => {
              setRestoreStock(e.target.checked);
            }}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="restoreStock"
            className="text-sm text-slate-700 font-medium cursor-pointer select-none"
          >
            Remove items from stock (Reverse Stock Addition)
          </label>
        </div>
      </ConfirmDeleteDialog>
    </div>
  );
}
