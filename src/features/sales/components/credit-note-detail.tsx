import { cn } from "@/lib/cn";
import { Card, CardHeader, CardBody, Button, Badge } from "@/components/ui";
import {
  X,
  Printer,
  Share2,
  Trash2,
  Edit,
  Calendar,
  User,
  FileText,
  RotateCcw,
  Percent,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { CreditNote, CreditNoteReason } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface CreditNoteDetailProps {
  creditNote: CreditNote;
  onClose?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  className?: string;
}

// ============================================================================
// REASON CONFIG
// ============================================================================

const reasonConfig: Record<
  CreditNoteReason,
  {
    label: string;
    icon: typeof RotateCcw;
    variant: "info" | "warning" | "error" | "secondary";
  }
> = {
  return: { label: "Return", icon: RotateCcw, variant: "info" },
  discount: { label: "Discount", icon: Percent, variant: "warning" },
  error: { label: "Error Correction", icon: AlertTriangle, variant: "error" },
  other: { label: "Other", icon: MoreHorizontal, variant: "secondary" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CreditNoteDetail({
  creditNote,
  onClose,
  onEdit,
  onDelete,
  onPrint,
  onShare,
  className,
}: CreditNoteDetailProps): React.ReactNode {
  const reason = reasonConfig[creditNote.reason];
  const ReasonIcon = reason.icon;

  const { formatCurrency } = useCurrency();

  const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-text-heading">
            {creditNote.creditNoteNumber}
          </h2>
          <p className="text-sm text-slate-500">Credit Note</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Amount Card */}
        <Card className="bg-error-light border-error/20">
          <CardBody className="text-center py-6">
            <p className="text-sm text-error-dark font-medium mb-1">
              Credit Amount
            </p>
            <p className="text-3xl font-bold text-error">
              -{formatCurrency(creditNote.total)}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Badge variant={reason.variant} size="md">
                <ReasonIcon className="h-4 w-4 mr-1" />
                {reason.label}
              </Badge>
            </div>
          </CardBody>
        </Card>

        {/* Credit Note Details */}
        <Card>
          <CardHeader title="Credit Note Details" />
          <CardBody className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Customer</p>
                <p className="font-medium text-text-heading">
                  {creditNote.customerName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="font-medium text-text-heading">
                  {formatDate(creditNote.date)}
                </p>
              </div>
            </div>

            {creditNote.invoiceNumber && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Original Invoice</p>
                  <p className="font-medium text-primary-600">
                    {creditNote.invoiceNumber}
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader title="Items" />
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {creditNote.items.map((item) => (
                <div key={item.id} className="p-4 flex justify-between">
                  <div>
                    <p className="font-medium text-text-heading">
                      {item.itemName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.quantity} {item.unit} ×{" "}
                      {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-medium text-text-heading">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Summary */}
        <Card>
          <CardBody className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(creditNote.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax</span>
              <span className="font-medium">
                {formatCurrency(creditNote.taxAmount)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between">
              <span className="font-semibold text-text-heading">
                Total Credit
              </span>
              <span className="font-bold text-error">
                {formatCurrency(creditNote.total)}
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Notes */}
        {creditNote.notes && (
          <Card>
            <CardHeader title="Notes" />
            <CardBody>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {creditNote.notes}
              </p>
            </CardBody>
          </Card>
        )}

        {/* Timestamps */}
        <Card>
          <CardBody className="text-xs text-slate-400 space-y-1">
            <p>Created: {formatDate(creditNote.createdAt)}</p>
            <p>Updated: {formatDate(creditNote.updatedAt)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <Button
          fullWidth
          variant="outline"
          leftIcon={<Edit className="h-4 w-4" />}
          onClick={onEdit}
        >
          Edit Credit Note
        </Button>
        <Button
          fullWidth
          variant="ghost"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={onDelete}
          className="text-error hover:bg-error-light"
        >
          Delete Credit Note
        </Button>
      </div>
    </div>
  );
}
