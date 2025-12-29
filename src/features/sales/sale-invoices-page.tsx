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
  type SelectOption,
} from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus, DollarSign } from "lucide-react";
import { InvoiceList, InvoiceDetail, InvoiceForm } from "./components";
import { useSaleInvoices, useSaleInvoiceMutations, useSaleInvoiceById } from "@/hooks/useSaleInvoices";
import { usePaymentInMutations } from "@/hooks/usePaymentIns";
import { useCashTransactionMutations } from "@/hooks/useCashTransactions";
import { useBankTransactionMutations } from "@/hooks/useBankTransactions";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useCustomers } from "@/hooks/useCustomers";
import { useItems } from "@/hooks/useItems";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import type { SaleInvoice, SaleInvoiceFormData, PaymentMode } from "./types";

export function SaleInvoicesPage() {
  // Data from PowerSync
  const { invoices, isLoading: invoicesLoading, error } = useSaleInvoices();
  const { customers } = useCustomers({ type: "customer" });
  const { items } = useItems({ isActive: true });
  const { accounts: bankAccounts } = useBankAccounts({ isActive: true });
  const { createInvoice, updateInvoice, updateInvoiceStatus, deleteInvoice } = useSaleInvoiceMutations();
  const { createPayment } = usePaymentInMutations();
  const { createTransaction: createCashTransaction } = useCashTransactionMutations();
  const { createTransaction: createBankTransaction } = useBankTransactionMutations();

  // PDF Generator
  const { downloadSaleInvoice, printSaleInvoice, isReady: pdfReady } = usePDFGenerator();

  // State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<SaleInvoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("");

  // Payment mode options
  const paymentModeOptions: SelectOption[] = [
    { value: "cash", label: "Cash" },
    { value: "bank", label: "Bank Transfer" },
    { value: "cheque", label: "Cheque" },
  ];

  // Bank account options for dropdown
  const bankAccountOptions: SelectOption[] = useMemo(() =>
    bankAccounts.map((account) => ({
      value: account.id,
      label: `${account.name} - ${account.bankName}`,
    })),
    [bankAccounts]
  );

  // Fetch full invoice with items when one is selected
  const { invoice: selectedInvoiceData, items: selectedInvoiceItems, isLoading: invoiceDetailLoading } = useSaleInvoiceById(selectedInvoiceId);

  // Merge invoice with items for the detail view
  const currentSelectedInvoice = useMemo(() => {
    if (!selectedInvoiceData) return null;
    return {
      ...selectedInvoiceData,
      items: selectedInvoiceItems,
    };
  }, [selectedInvoiceData, selectedInvoiceItems]);

  // Handlers
  const handleCreateInvoice = () => {
    setSelectedInvoiceId(null);
    setIsCreating(true);
  };

  const handleEditInvoice = () => {
    if (currentSelectedInvoice) {
      setIsEditing(true);
    }
  };

  const handleDeleteInvoice = () => {
    if (currentSelectedInvoice) {
      setInvoiceToDelete(currentSelectedInvoice);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
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

  const handleFormSubmit = async (data: SaleInvoiceFormData) => {
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

  const handleStatusChange = async (newStatus: string) => {
    if (currentSelectedInvoice) {
      try {
        await updateInvoiceStatus(currentSelectedInvoice.id, newStatus, currentSelectedInvoice.status);
      } catch (err) {
        console.error("Failed to update invoice status:", err);
      }
    }
  };

  const handleRecordPayment = () => {
    if (currentSelectedInvoice) {
      setPaymentAmount(currentSelectedInvoice.amountDue.toFixed(2));
      setPaymentMode("cash");
      setSelectedBankAccountId(bankAccounts[0]?.id ?? "");
      setIsPaymentModalOpen(true);
    }
  };

  // PDF handlers
  const handleDownloadPDF = () => {
    if (currentSelectedInvoice && pdfReady) {
      const customer = customers.find((c) => c.id === currentSelectedInvoice.customerId);
      downloadSaleInvoice(currentSelectedInvoice, customer);
    }
  };

  const handlePrintPDF = () => {
    if (currentSelectedInvoice && pdfReady) {
      const customer = customers.find((c) => c.id === currentSelectedInvoice.customerId);
      printSaleInvoice(currentSelectedInvoice, customer);
    }
  };

  const handleConfirmPayment = async () => {
    if (currentSelectedInvoice && paymentAmount) {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) return;

      // Validate bank account selection for bank payments
      if (paymentMode === "bank" && !selectedBankAccountId) {
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
        }
        // Note: Cheque payments would be handled separately via cheques page

        setIsPaymentModalOpen(false);
        setPaymentAmount("");
        setSelectedBankAccountId("");
      } catch (err) {
        console.error("Failed to record payment:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEditSubmit = async (data: SaleInvoiceFormData) => {
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
            onSubmit={(data) => { void handleFormSubmit(data); }}
            onCancel={() => { setIsCreating(false); }}
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
      items: currentSelectedInvoice.items.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
      })),
      discountPercent: currentSelectedInvoice.subtotal > 0
        ? (currentSelectedInvoice.discountAmount / currentSelectedInvoice.subtotal) * 100
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
            onSubmit={(data) => { void handleEditSubmit(data); }}
            onCancel={() => { setIsEditing(false); }}
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
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreateInvoice}>
            New Invoice
          </Button>
        }
      />

      {/* Content - Master-Detail Layout */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Invoice List (Master) */}
        <div className="w-[420px] shrink-0 overflow-auto">
          {invoicesLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <InvoiceList
              invoices={invoices}
              onInvoiceClick={(invoice) => setSelectedInvoiceId(invoice.id)}
              onCreateInvoice={handleCreateInvoice}
              className="h-full"
            />
          )}
        </div>

        {/* Invoice Detail (Detail) */}
        <div className="flex-1 overflow-auto">
          <InvoiceDetail
            invoice={currentSelectedInvoice}
            isLoading={invoiceDetailLoading}
            onEdit={handleEditInvoice}
            onDelete={() => { handleDeleteInvoice(); }}
            onStatusChange={(status) => { void handleStatusChange(status); }}
            onRecordPayment={handleRecordPayment}
            onDownload={handleDownloadPDF}
            onPrint={handlePrintPDF}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setInvoiceToDelete(null);
        }}
        size="sm"
      >
        <ModalContent>
          <ModalHeader title="Delete Invoice" />
          <ModalBody>
            <p className="text-slate-600">
              Are you sure you want to delete invoice{" "}
              <span className="font-semibold text-slate-900">
                {invoiceToDelete?.invoiceNumber}
              </span>
              ? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setInvoiceToDelete(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={() => { void handleConfirmDelete(); }} isLoading={isSubmitting}>
              Delete
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
                  onChange={(e) => { setPaymentAmount(e.target.value); }}
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
                  onChange={(value) => { setPaymentMode(value as PaymentMode); }}
                />
              </div>

              {paymentMode === "bank" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bank Account
                  </label>
                  <Select
                    options={bankAccountOptions}
                    value={selectedBankAccountId}
                    onChange={(value) => { setSelectedBankAccountId(value); }}
                    placeholder="Select bank account"
                  />
                </div>
              )}

              {paymentMode === "cheque" && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  Cheque payments should be recorded via the Cheques page for proper tracking.
                </p>
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
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => { void handleConfirmPayment(); }}
              isLoading={isSubmitting}
              disabled={
                !paymentAmount ||
                parseFloat(paymentAmount) <= 0 ||
                (paymentMode === "bank" && !selectedBankAccountId) ||
                paymentMode === "cheque"
              }
            >
              Record Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
