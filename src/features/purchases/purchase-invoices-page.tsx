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
} from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus, DollarSign } from "lucide-react";
import { PurchaseInvoiceList, PurchaseInvoiceDetail, PurchaseInvoiceForm } from "./components";
import { usePurchaseInvoices, usePurchaseInvoiceMutations, usePurchaseInvoiceLinkedItems } from "@/hooks/usePurchaseInvoices";
import { usePaymentOutMutations } from "@/hooks/usePaymentOuts";
import { useCashTransactionMutations } from "@/hooks/useCashTransactions";
import { useBankTransactionMutations } from "@/hooks/useBankTransactions";
import { useBankAccounts, useBankAccountMutations } from "@/hooks/useBankAccounts";
import { useChequeMutations } from "@/hooks/useCheques";
import { useCustomers } from "@/hooks/useCustomers";
import { useItems } from "@/hooks/useItems";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import type { PurchaseInvoice, PurchaseInvoiceFormData, PurchaseInvoiceStatus, PaymentOutMode } from "./types";

export function PurchaseInvoicesPage() {
  // Data from PowerSync
  const { invoices, isLoading, error } = usePurchaseInvoices();
  const { customers } = useCustomers({ type: "supplier" });
  const { items } = useItems({ isActive: true });
  const { accounts: bankAccounts } = useBankAccounts({ isActive: true });
  const { createInvoice, deleteInvoice, updateInvoiceStatus } = usePurchaseInvoiceMutations();
  const { createPayment } = usePaymentOutMutations();
  const { createTransaction: createCashTransaction } = useCashTransactionMutations();
  const { createTransaction: createBankTransaction } = useBankTransactionMutations();
  const { createCheque } = useChequeMutations();
  const { createAccount: createBankAccount } = useBankAccountMutations();

  // PDF Generator
  const { printPurchaseInvoice, isReady: pdfReady } = usePDFGenerator();

  // State
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseInvoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<PurchaseInvoice | null>(null);
  const linkedItems = usePurchaseInvoiceLinkedItems(invoiceToDelete?.id ?? null);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentOutMode>("cash");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("");

  // Cheque details state
  const [chequeNumber, setChequeNumber] = useState<string>("");
  const [chequeBankName, setChequeBankName] = useState<string>("");
  const [chequeDueDate, setChequeDueDate] = useState<string>("");

  // New bank account form state
  const [isAddingBankAccount, setIsAddingBankAccount] = useState(false);
  const [newBankAccountName, setNewBankAccountName] = useState<string>("");
  const [newBankName, setNewBankName] = useState<string>("");
  const [newBankAccountNumber, setNewBankAccountNumber] = useState<string>("");

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

  // Update selected purchase when data changes
  const currentSelectedPurchase = useMemo(() => {
    if (!selectedPurchase) return null;
    return invoices.find((p) => p.id === selectedPurchase.id) ?? null;
  }, [invoices, selectedPurchase]);

  // Handlers
  const handlePurchaseClick = (purchase: PurchaseInvoice) => {
    setSelectedPurchase(purchase);
  };

  const handleCloseDetail = () => {
    setSelectedPurchase(null);
  };

  const handleCreatePurchase = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSubmitPurchase = async (data: PurchaseInvoiceFormData) => {
    setIsSubmitting(true);
    try {
      // Generate invoice number
      const invoiceNumber = `PUR-${Date.now()}`;

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
      const subtotal = purchaseItems.reduce((sum, item) => sum + item.amount, 0);
      const discountAmount = subtotal * ((data.discountPercent ?? 0) / 100);

      await createInvoice(
        {
          invoiceNumber,
          ...(data.supplierInvoiceNumber && { supplierInvoiceNumber: data.supplierInvoiceNumber }),
          supplierId: data.customerId,
          supplierName,
          date: data.date,
          dueDate: data.dueDate ?? data.date, // Default to invoice date if not provided
          status: "draft",
          discountAmount,
          ...(data.notes && { notes: data.notes }),
        },
        purchaseItems
      );
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to create purchase invoice:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    if (currentSelectedPurchase) {
      setInvoiceToDelete(currentSelectedPurchase);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (invoiceToDelete) {
      setIsSubmitting(true);
      try {
        await deleteInvoice(invoiceToDelete.id);
        setSelectedPurchase(null);
        setIsDeleteModalOpen(false);
        setInvoiceToDelete(null);
      } catch (err) {
        console.error("Failed to delete purchase invoice:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRecordPayment = () => {
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

  const handleStatusChange = async (newStatus: PurchaseInvoiceStatus) => {
    if (currentSelectedPurchase && newStatus !== currentSelectedPurchase.status) {
      try {
        await updateInvoiceStatus(currentSelectedPurchase.id, newStatus);
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    }
  };

  const handleAddBankAccount = async () => {
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

  const handleConfirmPayment = async () => {
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
      if (paymentMode === "cheque" && (!chequeNumber || !chequeBankName || !chequeDueDate)) {
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
        setChequeDueDate("");
      } catch (err) {
        console.error("Failed to record payment:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // PDF handlers
  const handlePrintPurchase = () => {
    if (currentSelectedPurchase && pdfReady) {
      // Note: suppliers are stored in customers table with customerId
      const supplier = customers.find((c) => c.id === currentSelectedPurchase.customerId);
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
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreatePurchase}>
            New Purchase
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Purchase List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <PurchaseInvoiceList
              invoices={invoices}
              onInvoiceClick={handlePurchaseClick}
              onCreateInvoice={handleCreatePurchase}
            />
          )}
        </div>

        {/* Purchase Detail Panel */}
        {currentSelectedPurchase && (
          <div className="w-96 border-l border-slate-200 bg-white overflow-hidden">
            <PurchaseInvoiceDetail
              invoice={currentSelectedPurchase}
              onClose={handleCloseDetail}
              onEdit={() => { setIsFormOpen(true); }}
              onDelete={handleDeleteClick}
              onPrint={handlePrintPurchase}
              onRecordPayment={handleRecordPayment}
              onStatusChange={(status) => { void handleStatusChange(status); }}
            />
          </div>
        )}
      </div>

      {/* Purchase Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="full">
        <ModalContent className="max-w-6xl mx-auto my-4 h-[calc(100vh-2rem)]">
          <ModalHeader onClose={handleCloseForm}>
            New Purchase Invoice
          </ModalHeader>
          <ModalBody className="p-0 overflow-y-auto">
            <PurchaseInvoiceForm
              customers={customers}
              items={items}
              onSubmit={(data) => { void handleSubmitPurchase(data); }}
              onCancel={handleCloseForm}
              className="p-6"
            />
          </ModalBody>
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
              <div className="p-3 bg-slate-50 rounded-lg">
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
                  onChange={(value) => { setPaymentMode(value as PaymentOutMode); }}
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
                          onClick={() => { setIsAddingBankAccount(true); }}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add New
                        </button>
                      </div>
                      <Select
                        options={bankAccountOptions}
                        value={selectedBankAccountId}
                        onChange={(value) => { setSelectedBankAccountId(value); }}
                        placeholder="Select bank account"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Add Bank Account</span>
                        <button
                          type="button"
                          onClick={() => { setIsAddingBankAccount(false); }}
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
                          onChange={(e) => { setNewBankAccountName(e.target.value); }}
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
                          onChange={(e) => { setNewBankName(e.target.value); }}
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
                          onChange={(e) => { setNewBankAccountNumber(e.target.value); }}
                          placeholder="Enter account number"
                          size="sm"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => { void handleAddBankAccount(); }}
                        disabled={!newBankAccountName || !newBankName || !newBankAccountNumber}
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
                      onChange={(e) => { setChequeNumber(e.target.value); }}
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
                      onChange={(e) => { setChequeBankName(e.target.value); }}
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
                      onChange={(e) => { setChequeDueDate(e.target.value); }}
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
              onClick={() => { void handleConfirmPayment(); }}
              isLoading={isSubmitting}
              disabled={
                !paymentAmount ||
                parseFloat(paymentAmount) <= 0 ||
                (paymentMode === "bank" && (!selectedBankAccountId || isAddingBankAccount)) ||
                (paymentMode === "cheque" && (!chequeNumber || !chequeBankName || !chequeDueDate))
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
        onConfirm={() => { void handleConfirmDelete(); }}
        title="Delete Purchase Invoice"
        itemName={invoiceToDelete?.invoiceNumber ?? ""}
        itemType="Purchase Invoice"
        warningMessage="This will permanently delete the purchase invoice and reverse all related stock and balance changes."
        linkedItems={[
          { type: "Invoice Item", count: linkedItems.itemsCount, description: "Stock will be reversed" },
          { type: "Payment", count: linkedItems.paymentsCount, description: "Will be deleted" },
        ]}
        isLoading={isSubmitting}
      />
    </div>
  );
}
