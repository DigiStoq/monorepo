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
  Select,
  ConfirmDeleteDialog,
  type SelectOption,
  SearchInput,
} from "@/components/ui";
import { Spinner } from "@/components/common";
import {
  Plus,
  DollarSign,
  RotateCcw,
  Package,
  CheckCircle,
  Clock,
} from "lucide-react";
import { InvoiceList, InvoiceDetail, InvoiceForm } from "./components";
import {
  useSaleInvoices,
  useSaleInvoiceMutations,
  useSaleInvoiceById,
  useSaleInvoiceLinkedItems,
} from "@/hooks/useSaleInvoices";
import { usePaymentInMutations } from "@/hooks/usePaymentIns";
import { useCashTransactionMutations } from "@/hooks/useCashTransactions";
import { useBankTransactionMutations } from "@/hooks/useBankTransactions";
import {
  useBankAccounts,
  useBankAccountMutations,
} from "@/hooks/useBankAccounts";
import { useChequeMutations } from "@/hooks/useCheques";
import { useCustomers } from "@/hooks/useCustomers";
import { useItems, useItemMutations } from "@/hooks/useItems";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import type {
  SaleInvoice,
  SaleInvoiceFormData,
  PaymentMode,
  SaleFilters,
  InvoiceStatus,
} from "./types";

export function SaleInvoicesPage(): React.ReactNode {
  // Data from PowerSync
  const { invoices, isLoading: invoicesLoading, error } = useSaleInvoices();
  const { customers } = useCustomers({ type: "customer" });
  const { items } = useItems({ isActive: true });
  const { accounts: bankAccounts } = useBankAccounts({ isActive: true });
  const { createInvoice, updateInvoice, updateInvoiceStatus, deleteInvoice } =
    useSaleInvoiceMutations();
  const { createPayment } = usePaymentInMutations();
  const { createTransaction: createCashTransaction } =
    useCashTransactionMutations();
  const { createTransaction: createBankTransaction } =
    useBankTransactionMutations();
  const { createCheque } = useChequeMutations();
  const { createAccount: createBankAccount } = useBankAccountMutations();
  const { adjustStock } = useItemMutations();

  // PDF Generator
  const {
    downloadSaleInvoice,
    printSaleInvoice,
    isReady: pdfReady,
  } = usePDFGenerator();

  // State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<SaleInvoice | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<SaleFilters>({
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
    { value: "unpaid", label: "Unpaid" },
    { value: "paid", label: "Paid" },
    { value: "returned", label: "Returned" },
  ];

  // Filter Logic
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((invoice) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesNumber = invoice.invoiceNumber
            .toLowerCase()
            .includes(searchLower);
          const matchesCustomer = invoice.customerName
            .toLowerCase()
            .includes(searchLower);
          if (!matchesNumber && !matchesCustomer) return false;
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
          case "customer":
            comparison = a.customerName.localeCompare(b.customerName);
            break;
        }

        return filters.sortOrder === "desc" ? comparison : -comparison;
      });
  }, [invoices, filters]);

  // Totals Calculation
  const totals = useMemo(() => {
    if (!filteredInvoices.length)
      return { total: 0, paid: 0, unpaid: 0, returned: 0 };

    return filteredInvoices.reduce(
      (acc, inv) => {
        acc.total += inv.total;
        acc.paid += inv.amountPaid;
        if (inv.status === "returned") {
          acc.returned += inv.total;
        } else if (inv.status === "unpaid" || inv.amountDue > 0) {
          acc.unpaid += inv.amountDue;
        }
        return acc;
      },
      { total: 0, paid: 0, unpaid: 0, returned: 0 }
    );
  }, [filteredInvoices]);

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  // Linked items for delete dialog
  const linkedItems = useSaleInvoiceLinkedItems(invoiceToDelete?.id ?? null);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
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

  // Return modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState<string>("");
  const [addToStock, setAddToStock] = useState(true);

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

  // Fetch full invoice with items when one is selected
  const {
    invoice: selectedInvoiceData,
    items: selectedInvoiceItems,
    isLoading: invoiceDetailLoading,
  } = useSaleInvoiceById(selectedInvoiceId);

  // Merge invoice with items for the detail view
  const currentSelectedInvoice = useMemo(() => {
    if (!selectedInvoiceData) return null;
    return {
      ...selectedInvoiceData,
      items: selectedInvoiceItems,
    };
  }, [selectedInvoiceData, selectedInvoiceItems]);

  // Handlers
  const handleCreateInvoice = (): void => {
    setSelectedInvoiceId(null);
    setIsCreating(true);
  };

  const handleEditInvoice = (): void => {
    if (currentSelectedInvoice) {
      setIsEditing(true);
    }
  };

  const handleDeleteInvoice = (): void => {
    if (currentSelectedInvoice) {
      setInvoiceToDelete(currentSelectedInvoice);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (invoiceToDelete) {
      setIsSubmitting(true);
      try {
        await deleteInvoice(invoiceToDelete.id);
        setIsDeleteModalOpen(false);
        setInvoiceToDelete(null);
        setSelectedInvoiceId(null);
      } catch (err) {
        console.error("Failed to delete invoice:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFormSubmit = async (data: SaleInvoiceFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;

      // Lookup customer name from customerId
      const customer = customers.find((c) => c.id === data.customerId);
      const customerName = customer?.name ?? "Unknown";

      // Calculate due date - default to 30 days from invoice date if not provided
      const invoiceDate = new Date(data.date);
      const defaultDueDate = new Date(invoiceDate);
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      const dueDate = data.dueDate ?? defaultDueDate.toISOString().slice(0, 10);

      // Transform form items to include itemName, unit, and amount
      const invoiceItems = data.items.map((formItem) => {
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
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
      const discountAmount = subtotal * ((data.discountPercent ?? 0) / 100);

      await createInvoice(
        {
          invoiceNumber,
          customerId: data.customerId,
          customerName,
          date: data.date,
          dueDate,
          status: "draft",
          discountAmount,
          ...(data.notes && { notes: data.notes }),
          ...(data.terms && { terms: data.terms }),
        },
        invoiceItems
      );
      setIsCreating(false);
    } catch (err) {
      console.error("Failed to create invoice:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string): Promise<void> => {
    if (currentSelectedInvoice) {
      // If changing to "paid", show payment modal instead of directly updating status
      if (newStatus === "paid" && currentSelectedInvoice.status !== "paid") {
        setPaymentAmount(currentSelectedInvoice.amountDue.toFixed(2));
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
        return;
      }

      // If changing to "returned", show return reason modal
      if (
        newStatus === "returned" &&
        currentSelectedInvoice.status !== "returned"
      ) {
        setReturnReason("");
        setAddToStock(true);
        setIsReturnModalOpen(true);
        return;
      }

      try {
        await updateInvoiceStatus(
          currentSelectedInvoice.id,
          newStatus,
          currentSelectedInvoice.status
        );
      } catch (err) {
        console.error("Failed to update invoice status:", err);
      }
    }
  };

  const handleRecordPayment = (): void => {
    if (currentSelectedInvoice) {
      setPaymentAmount(currentSelectedInvoice.amountDue.toFixed(2));
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
    } catch (err) {
      console.error("Failed to create bank account:", err);
    }
  };

  const handleConfirmReturn = async (): Promise<void> => {
    if (currentSelectedInvoice && returnReason.trim()) {
      setIsSubmitting(true);
      try {
        // Update invoice status with reason
        await updateInvoiceStatus(
          currentSelectedInvoice.id,
          "returned",
          currentSelectedInvoice.status,
          returnReason.trim()
        );

        // Add items back to stock if checkbox is checked
        if (addToStock && currentSelectedInvoice.items.length > 0) {
          for (const item of currentSelectedInvoice.items) {
            await adjustStock(item.itemId, item.quantity);
          }
        }

        setIsReturnModalOpen(false);
        setReturnReason("");
        setAddToStock(true);
      } catch (err) {
        console.error("Failed to return invoice:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // PDF handlers
  const handleDownloadPDF = (): void => {
    if (currentSelectedInvoice && pdfReady) {
      const customer = customers.find(
        (c) => c.id === currentSelectedInvoice.customerId
      );
      downloadSaleInvoice(currentSelectedInvoice, customer);
    }
  };

  const handlePrintPDF = (): void => {
    if (currentSelectedInvoice && pdfReady) {
      const customer = customers.find(
        (c) => c.id === currentSelectedInvoice.customerId
      );
      printSaleInvoice(currentSelectedInvoice, customer);
    }
  };

  const handleConfirmPayment = async (): Promise<void> => {
    // Prevent double submission
    if (isSubmitting) return;

    if (currentSelectedInvoice && paymentAmount) {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) return;

      // Prevent overpayment
      if (amount > currentSelectedInvoice.amountDue) {
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
        const receiptNumber = `REC-${Date.now()}`;

        // 1. Create Payment In record (this also updates the invoice)
        await createPayment({
          receiptNumber,
          customerId: currentSelectedInvoice.customerId,
          customerName: currentSelectedInvoice.customerName,
          date: today,
          amount,
          paymentMode,
          invoiceId: currentSelectedInvoice.id,
          invoiceNumber: currentSelectedInvoice.invoiceNumber,
        });

        // 2. Create corresponding transaction based on payment mode
        if (paymentMode === "cash") {
          await createCashTransaction({
            date: today,
            type: "in",
            amount,
            description: `Payment received for ${currentSelectedInvoice.invoiceNumber}`,
            category: "Invoice Payment",
            relatedCustomerId: currentSelectedInvoice.customerId,
            relatedCustomerName: currentSelectedInvoice.customerName,
            relatedInvoiceId: currentSelectedInvoice.id,
            relatedInvoiceNumber: currentSelectedInvoice.invoiceNumber,
          });
        } else if (paymentMode === "bank") {
          await createBankTransaction({
            accountId: selectedBankAccountId,
            date: today,
            type: "deposit",
            amount,
            description: `Payment received for ${currentSelectedInvoice.invoiceNumber}`,
            relatedCustomerId: currentSelectedInvoice.customerId,
            relatedCustomerName: currentSelectedInvoice.customerName,
            relatedInvoiceId: currentSelectedInvoice.id,
            relatedInvoiceNumber: currentSelectedInvoice.invoiceNumber,
          });
        } else if (paymentMode === "cheque") {
          // Create cheque record for tracking
          await createCheque({
            chequeNumber,
            type: "received",
            customerId: currentSelectedInvoice.customerId,
            customerName: currentSelectedInvoice.customerName,
            bankName: chequeBankName,
            date: today,
            dueDate: chequeDueDate,
            amount,
            relatedInvoiceId: currentSelectedInvoice.id,
            relatedInvoiceNumber: currentSelectedInvoice.invoiceNumber,
          });
        }

        setIsPaymentModalOpen(false);
        setPaymentAmount("");
        setSelectedBankAccountId("");
        setChequeNumber("");
        setChequeBankName("");
        setChequeDueDate("");
      } catch (err) {
        console.error("Failed to record payment:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEditSubmit = async (data: SaleInvoiceFormData): Promise<void> => {
    if (!currentSelectedInvoice) return;

    setIsSubmitting(true);
    try {
      // Lookup customer name from customerId
      const customer = customers.find((c) => c.id === data.customerId);
      const customerName = customer?.name ?? "Unknown";

      // Calculate due date
      const invoiceDate = new Date(data.date);
      const defaultDueDate = new Date(invoiceDate);
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      const dueDate = data.dueDate ?? defaultDueDate.toISOString().slice(0, 10);

      // Transform form items
      const invoiceItems = data.items.map((formItem) => {
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

      // Calculate discount amount
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
      const discountAmount = subtotal * ((data.discountPercent ?? 0) / 100);

      await updateInvoice(
        currentSelectedInvoice.id,
        {
          invoiceNumber: currentSelectedInvoice.invoiceNumber,
          customerId: data.customerId,
          customerName,
          date: data.date,
          dueDate,
          status: currentSelectedInvoice.status,
          discountAmount,
          ...(data.notes && { notes: data.notes }),
          ...(data.terms && { terms: data.terms }),
        },
        invoiceItems,
        currentSelectedInvoice
      );
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update invoice:", err);
    } finally {
      setIsSubmitting(false);
    }
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
            onSubmit={(data) => {
              void handleFormSubmit(data);
            }}
            onCancel={() => {
              setIsCreating(false);
            }}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    );
  }

  // Show invoice form when editing
  if (isEditing && currentSelectedInvoice) {
    // Convert invoice data to form format
    const editInitialData: Partial<SaleInvoiceFormData> = {
      customerId: currentSelectedInvoice.customerId,
      date: currentSelectedInvoice.date,
      dueDate: currentSelectedInvoice.dueDate,
      items: currentSelectedInvoice.items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
      })),
      discountPercent:
        currentSelectedInvoice.subtotal > 0
          ? (currentSelectedInvoice.discountAmount /
              currentSelectedInvoice.subtotal) *
            100
          : 0,
      notes: currentSelectedInvoice.notes,
      terms: currentSelectedInvoice.terms,
    };

    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto p-4">
          <InvoiceForm
            customers={customers}
            items={items}
            initialData={editInitialData}
            onSubmit={(data) => {
              void handleEditSubmit(data);
            }}
            onCancel={() => {
              setIsEditing(false);
            }}
            isSubmitting={isSubmitting}
            isEditing
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
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleCreateInvoice}
          >
            New Invoice
          </Button>
        }
      />

      {/* Filters Header - Full Width */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <SearchInput
              placeholder="Search invoices..."
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
                    status: value as InvoiceStatus | "all",
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
                <DollarSign className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Total Revenue
                </p>
                <p className="text-lg font-bold text-slate-900 leading-none">
                  {formatCurrency(totals.total)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-success-light rounded-lg border border-success/20 whitespace-nowrap">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
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
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-warning-dark font-medium uppercase tracking-wider">
                  Unpaid
                </p>
                <p className="text-lg font-bold text-warning-dark leading-none">
                  {formatCurrency(totals.unpaid)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Master-Detail Layout */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden bg-slate-50">
        {/* Invoice List (Master) */}
        <div className="w-full max-w-[420px] shrink-0 overflow-hidden flex flex-col">
          {invoicesLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <InvoiceList
              invoices={filteredInvoices}
              onInvoiceClick={(invoice) => {
                setSelectedInvoiceId(invoice.id);
              }}
              onCreateInvoice={handleCreateInvoice}
              className="h-full overflow-auto pr-1"
              hasActiveFilters={!!filters.search || filters.status !== "all"}
            />
          )}
        </div>

        {/* Invoice Detail (Detail) */}
        <div className="flex-1 overflow-auto">
          <InvoiceDetail
            invoice={currentSelectedInvoice}
            isLoading={invoiceDetailLoading}
            onEdit={handleEditInvoice}
            onDelete={() => {
              handleDeleteInvoice();
            }}
            onStatusChange={(status) => {
              void handleStatusChange(status);
            }}
            onRecordPayment={handleRecordPayment}
            onDownload={handleDownloadPDF}
            onPrint={handlePrintPDF}
          />
        </div>
      </div>

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
        title="Delete Sale Invoice"
        itemName={invoiceToDelete?.invoiceNumber ?? ""}
        itemType="Sale Invoice"
        warningMessage="This will permanently delete the sale invoice and reverse all related stock and balance changes."
        linkedItems={[
          {
            type: "Invoice Item",
            count: linkedItems.itemsCount,
            description: "Stock will be reversed",
          },
          {
            type: "Payment",
            count: linkedItems.paymentsCount,
            description: "Will be deleted",
          },
        ]}
        isLoading={isSubmitting}
      />

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
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Invoice</p>
                <p className="font-semibold text-slate-900">
                  {currentSelectedInvoice?.invoiceNumber}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Amount Due: ${currentSelectedInvoice?.amountDue.toFixed(2)}
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
                  max={currentSelectedInvoice?.amountDue}
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
                    setPaymentMode(value as PaymentMode);
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Cheque Date (Due Date)
                    </label>
                    <Input
                      type="date"
                      value={chequeDueDate}
                      onChange={(e) => {
                        setChequeDueDate(e.target.value);
                      }}
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

      {/* Return Invoice Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setReturnReason("");
          setAddToStock(true);
        }}
        size="sm"
      >
        <ModalContent>
          <ModalHeader title="Return Invoice" />
          <ModalBody>
            <div className="space-y-4">
              <div className="p-3 bg-error-light rounded-lg flex items-center gap-3">
                <RotateCcw className="h-5 w-5 text-error" />
                <div>
                  <p className="text-sm font-medium text-error-dark">
                    Returning Invoice
                  </p>
                  <p className="text-sm text-error-dark">
                    {currentSelectedInvoice?.invoiceNumber}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason for Return <span className="text-error">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  value={returnReason}
                  onChange={(e) => {
                    setReturnReason(e.target.value);
                  }}
                  placeholder="Enter the reason for returning this invoice (e.g., goods damaged, customer requested cancellation, wrong items shipped...)"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This reason will be recorded in the invoice history.
                </p>
              </div>

              {/* Add to Stock Option */}
              <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={addToStock}
                  onChange={(e) => {
                    setAddToStock(e.target.checked);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">
                      Add items back to stock
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Returned items will be added back to inventory (
                    {currentSelectedInvoice?.items.length ?? 0} items)
                  </p>
                </div>
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsReturnModalOpen(false);
                setReturnReason("");
                setAddToStock(true);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                void handleConfirmReturn();
              }}
              isLoading={isSubmitting}
              disabled={!returnReason.trim()}
            >
              Confirm Return
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
