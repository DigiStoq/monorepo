import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  Modal,
  Button,
  Select,
  Input,
  type SelectOption,
  Card,
  CardBody,
} from "@/components/ui";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileDown,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { ExportEntityType, ExportFormat, ExportOptions, ExportResult } from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<ExportResult>;
  defaultEntityType?: ExportEntityType;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const entityOptions: SelectOption[] = [
  { value: "customers", label: "Customers" },
  { value: "items", label: "Items / Inventory" },
  { value: "sale-invoices", label: "Sale Invoices" },
  { value: "purchase-invoices", label: "Purchase Invoices" },
  { value: "payments", label: "Payments" },
  { value: "expenses", label: "Expenses" },
];

const formatOptions: Array<{ value: ExportFormat; label: string; icon: React.ReactNode; description: string }> = [
  {
    value: "csv",
    label: "CSV",
    icon: <FileSpreadsheet className="h-6 w-6" />,
    description: "Comma-separated values, compatible with Excel",
  },
  {
    value: "xlsx",
    label: "Excel",
    icon: <FileSpreadsheet className="h-6 w-6 text-green-600" />,
    description: "Microsoft Excel format with formatting",
  },
  {
    value: "pdf",
    label: "PDF",
    icon: <FileText className="h-6 w-6 text-red-500" />,
    description: "Portable document format for printing",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  defaultEntityType = "customers",
}: ExportModalProps) {
  const [entityType, setEntityType] = useState<ExportEntityType>(defaultEntityType);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);

  const needsDateRange = ["sale-invoices", "purchase-invoices", "payments", "expenses"].includes(entityType);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        entityType,
        format,
        ...(needsDateRange && dateFrom && dateTo && {
          dateRange: { from: dateFrom, to: dateTo },
        }),
      };

      const exportResult = await onExport(options);
      setResult(exportResult);
    } catch {
      setResult({
        success: false,
        filename: "",
        recordCount: 0,
        fileSize: 0,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (result) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Export Complete" size="sm">
        <div className="py-8 text-center space-y-6">
          {result.success ? (
            <>
              <div className="w-20 h-20 mx-auto bg-success-light rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Export Successful!</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Your file is ready for download
                </p>
              </div>
              <Card className="text-left">
                <CardBody className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Filename</span>
                    <span className="font-medium text-slate-900">{result.filename}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Records</span>
                    <span className="font-medium text-slate-900">{result.recordCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">File Size</span>
                    <span className="font-medium text-slate-900">{formatFileSize(result.fileSize)}</span>
                  </div>
                </CardBody>
              </Card>
              <Button onClick={handleClose} leftIcon={<Download className="h-4 w-4" />}>
                Download File
              </Button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto bg-error-light rounded-full flex items-center justify-center">
                <FileDown className="h-10 w-10 text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Export Failed</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Something went wrong. Please try again.
                </p>
              </div>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Export Data" size="md">
      <div className="space-y-6 py-4">
        {/* Entity Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            What do you want to export?
          </label>
          <Select
            options={entityOptions}
            value={entityType}
            onChange={(v) => setEntityType(v as ExportEntityType)}
          />
        </div>

        {/* Date Range (conditional) */}
        {needsDateRange && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date Range (optional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Leave empty to export all records
            </p>
          </div>
        )}

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-3">
            {formatOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormat(opt.value)}
                className={cn(
                  "p-4 rounded-xl border-2 text-center transition-all",
                  format === opt.value
                    ? "border-primary bg-primary-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex justify-center mb-2">{opt.icon}</div>
                <p className="font-medium text-slate-900">{opt.label}</p>
                <p className="text-xs text-slate-500 mt-1">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <Card className="bg-slate-50">
          <CardBody className="flex items-start gap-3">
            <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-slate-700">Export Information</p>
              <p className="text-slate-500 mt-1">
                {entityType === "customers" && "Includes all customer details, contact info, and balance."}
                {entityType === "items" && "Includes item details, pricing, stock levels, and categories."}
                {entityType === "sale-invoices" && "Includes invoice details, line items, and payment status."}
                {entityType === "purchase-invoices" && "Includes purchase details, supplier info, and amounts."}
                {entityType === "payments" && "Includes all payment records with dates and references."}
                {entityType === "expenses" && "Includes expense categories, amounts, and descriptions."}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          leftIcon={
            isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )
          }
        >
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </div>
    </Modal>
  );
}
