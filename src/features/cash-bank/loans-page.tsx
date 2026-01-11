import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import { Button, Modal, ModalContent, ModalHeader, ModalBody } from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { LoanList, LoanDetail, LoanForm, LoanPaymentForm } from "./components";
import { useLoans, useLoanMutations } from "@/hooks/useLoans";
import { useLoanPayments, useLoanPaymentMutations } from "@/hooks/useLoanPayments";
import { useCustomers } from "@/hooks/useCustomers";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import type { Loan, LoanFormData, LoanPaymentFormData } from "./types";

export function LoansPage() {
  // Data from PowerSync
  const { loans, isLoading, error } = useLoans();
  const { customers } = useCustomers();
  const { accounts: bankAccounts } = useBankAccounts();
  const { createLoan, deleteLoan } = useLoanMutations();
  const { createPayment } = useLoanPaymentMutations();

  // State
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);

  // Update selected loan when data changes
  const currentSelectedLoan = useMemo(() => {
    if (!selectedLoan) return null;
    return loans.find((l) => l.id === selectedLoan.id) ?? null;
  }, [loans, selectedLoan]);

  // Get payments for selected loan
  const { payments: loanPayments } = useLoanPayments(
    currentSelectedLoan ? { loanId: currentSelectedLoan.id } : undefined
  );

  // Handlers
  const handleLoanClick = (loan: Loan) => {
    setSelectedLoan(loan);
  };

  const handleCloseDetail = () => {
    setSelectedLoan(null);
  };

  const handleCreateLoan = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSubmitLoan = async (data: LoanFormData) => {
    try {
      // Find customer name if customer ID is provided
      const customer = data.customerId ? customers.find((c) => c.id === data.customerId) : null;
      await createLoan({
        name: data.name,
        type: data.type,
        customerId: data.customerId,
        customerName: customer?.name,
        lenderName: data.lenderName,
        principalAmount: data.principalAmount,
        interestRate: data.interestRate,
        interestType: data.interestType,
        startDate: data.startDate,
        endDate: data.endDate,
        emiAmount: data.emiAmount,
        emiDay: data.emiDay,
        totalEmis: data.totalEmis,
        notes: data.notes,
      });
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to create loan:", err);
    }
  };

  const handleDeleteLoan = async () => {
    if (currentSelectedLoan) {
      try {
        await deleteLoan(currentSelectedLoan.id);
        setSelectedLoan(null);
      } catch (err) {
        console.error("Failed to delete loan:", err);
      }
    }
  };

  const handleOpenPaymentForm = () => {
    setIsPaymentFormOpen(true);
  };

  const handleClosePaymentForm = () => {
    setIsPaymentFormOpen(false);
  };

  const handleSubmitPayment = async (data: LoanPaymentFormData) => {
    if (!currentSelectedLoan) return;

    try {
      const totalAmount = data.principalAmount + data.interestAmount;
      await createPayment({
        loanId: currentSelectedLoan.id,
        date: data.date,
        principalAmount: data.principalAmount,
        interestAmount: data.interestAmount,
        totalAmount,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
      });
      setIsPaymentFormOpen(false);
    } catch (err) {
      console.error("Failed to record payment:", err);
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load loans</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Loans"
        description="Manage loans taken and given"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreateLoan}>
            Add Loan
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Loan List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <LoanList
              loans={loans}
              onLoanClick={handleLoanClick}
            />
          )}
        </div>

        {/* Loan Detail Panel */}
        {currentSelectedLoan && (
          <div className="w-[420px] border-l border-slate-200 bg-white overflow-hidden">
            <LoanDetail
              loan={currentSelectedLoan}
              payments={loanPayments}
              onClose={handleCloseDetail}
              onEdit={() => setIsFormOpen(true)}
              onDelete={handleDeleteLoan}
              onAddPayment={handleOpenPaymentForm}
            />
          </div>
        )}
      </div>

      {/* Loan Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="xl">
        <ModalContent>
          <ModalHeader onClose={handleCloseForm}>
            Add Loan
          </ModalHeader>
          <ModalBody>
            <LoanForm
              customers={customers}
              bankAccounts={bankAccounts}
              onSubmit={handleSubmitLoan}
              onCancel={handleCloseForm}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Payment Form Modal */}
      <Modal isOpen={isPaymentFormOpen} onClose={handleClosePaymentForm} size="md">
        <ModalContent>
          <ModalHeader onClose={handleClosePaymentForm}>
            Record Loan Payment
          </ModalHeader>
          <ModalBody>
            {currentSelectedLoan && (
              <LoanPaymentForm
                loanName={currentSelectedLoan.name}
                outstandingAmount={currentSelectedLoan.outstandingAmount}
                suggestedEmiAmount={currentSelectedLoan.emiAmount}
                onSubmit={handleSubmitPayment}
                onCancel={handleClosePaymentForm}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
