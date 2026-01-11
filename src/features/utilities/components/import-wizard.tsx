import { useState } from "react";
import { cn } from "@/lib/cn";
import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { parseCSV } from "@/lib/csv-parser";
import {
  Modal,
  Button,
  Select,
  type SelectOption,
  Badge,
  Card,
  CardBody,
} from "@/components/ui";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
} from "lucide-react";
import type { ImportEntityType, ImportPreview, ImportResult } from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    entityType: ImportEntityType,
    data: Record<string, unknown>[]
  ) => Promise<ImportResult>;
}

type WizardStep = "select" | "upload" | "mapping" | "preview" | "result";

interface FieldMapping {
  sourceColumn: string;
  targetField: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const entityOptions: SelectOption[] = [
  { value: "customers", label: "Customers" },
  { value: "items", label: "Items / Inventory" },
  { value: "invoices", label: "Invoices" },
];

const customerFields = [
  { value: "name", label: "Name", required: true },
  { value: "type", label: "Type (Customer/Supplier)" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "taxId", label: "Tax ID" },
  { value: "address", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "zipCode", label: "ZIP Code" },
  { value: "openingBalance", label: "Opening Balance" },
  { value: "creditLimit", label: "Credit Limit" },
];

const itemFields = [
  { value: "name", label: "Name", required: true },
  { value: "sku", label: "SKU" },
  { value: "description", label: "Description" },
  { value: "category", label: "Category" },
  { value: "salePrice", label: "Sale Price" },
  { value: "purchasePrice", label: "Purchase Price" },
  { value: "unit", label: "Unit" },
  { value: "openingStock", label: "Opening Stock" },
  { value: "minStock", label: "Minimum Stock" },
  { value: "taxRate", label: "Tax Rate %" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ImportWizard({
  isOpen,
  onClose,
  onImport,
}: ImportWizardProps): React.ReactNode {
  const [step, setStep] = useState<WizardStep>("select");
  const [entityType, setEntityType] = useState<ImportEntityType>("customers");
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const targetFields = entityType === "customers" ? customerFields : itemFields;

  // Helper to process file content (Text)
  const processFileContent = (content: string): void => {
    const rawData = parseCSV(content); // simple parsing

    if (rawData.length === 0) {
      alert("No records found in CSV");
      return;
    }

    const detectedColumns = Object.keys(rawData[0]);
    setColumns(detectedColumns);
    setFileData(rawData as unknown as Record<string, unknown>[]); // simple cast for now

    // Auto-suggest mappings
    const autoMappings = detectedColumns.map((col) => {
      const normalized = col.toLowerCase().replace(/[^a-z]/g, "");
      const match = targetFields.find((f) => {
        const fieldNormalized = f.value.toLowerCase();
        const labelNormalized = f.label.toLowerCase().replace(/[^a-z]/g, "");
        return (
          normalized.includes(fieldNormalized) ||
          normalized.includes(labelNormalized)
        );
      });
      return {
        sourceColumn: col,
        targetField: match?.value ?? "",
      };
    });
    setMappings(autoMappings);
  };

  const handleNativeFileUpload = async (): Promise<void> => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "CSV File",
            extensions: ["csv"],
          },
        ],
      });

      if (typeof selected === "string") {
        const contents = await readTextFile(selected);
        // Derive filename from path (windows vs unix)
        const name = selected.split(/[\\/]/).pop() ?? "imported_file.csv";

        // Set file object mock for UI display
        // We can't create a real File object from path easily without reading into blob,
        // but we only need name and size for UI.
        const size = new Blob([contents]).size; // approximation

        setFile({ name, size } as File);
        processFileContent(contents);
      }
    } catch (err) {
      console.error("Failed to open file", err);
    }
  };

  const handleWebFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        processFileContent(text);
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleMappingChange = (
    sourceColumn: string,
    targetField: string
  ): void => {
    setMappings((prev) =>
      prev.map((m) =>
        m.sourceColumn === sourceColumn ? { ...m, targetField } : m
      )
    );
  };

  const generatePreview = (): void => {
    const validRows = fileData.length;
    const errors = fileData.flatMap((row, idx) => {
      const rowErrors: ImportPreview["errors"] = [];
      const nameMapping = mappings.find((m) => m.targetField === "name");
      if (nameMapping && !row[nameMapping.sourceColumn]) {
        rowErrors.push({
          row: idx + 1,
          field: "name",
          message: "Name is required",
          value: row[nameMapping.sourceColumn],
        });
      }
      return rowErrors;
    });

    setPreview({
      totalRows: fileData.length,
      validRows:
        validRows -
        errors.filter(
          (e, i, arr) => arr.findIndex((x) => x.row === e.row) === i
        ).length,
      invalidRows: errors.filter(
        (e, i, arr) => arr.findIndex((x) => x.row === e.row) === i
      ).length,
      errors,
      previewData: fileData.slice(0, 5),
    });
  };

  const handleImport = async (): Promise<void> => {
    setIsProcessing(true);
    try {
      // Transform data based on mappings
      const transformedData = fileData.map((row) => {
        const transformed: Record<string, unknown> = {};
        mappings.forEach((m) => {
          if (m.targetField) {
            transformed[m.targetField] = row[m.sourceColumn];
          }
        });
        return transformed;
      });

      const importResult = await onImport(entityType, transformedData);
      setResult(importResult);
      setStep("result");
    } catch {
      setResult({
        success: false,
        imported: 0,
        skipped: fileData.length,
        errors: [{ row: 0, field: "", message: "Import failed", value: null }],
      });
      setStep("result");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = (): void => {
    setStep("select");
    setFile(null);
    setFileData([]);
    setColumns([]);
    setMappings([]);
    setPreview(null);
    setResult(null);
    onClose();
  };

  const downloadTemplate = (): void => {
    // In production, generate and download actual CSV template
    const templateFields =
      entityType === "customers"
        ? "Name,Type,Phone,Email,Tax ID,Address,City,State,ZIP Code,Opening Balance,Credit Limit"
        : "Name,SKU,Description,Category,Sale Price,Purchase Price,Unit,Opening Stock,Min Stock,Tax Rate";

    const blob = new Blob([templateFields], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entityType}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStepIndicator = (): React.ReactNode => {
    const steps = [
      { key: "select", label: "Select Type" },
      { key: "upload", label: "Upload File" },
      { key: "mapping", label: "Map Fields" },
      { key: "preview", label: "Preview" },
      { key: "result", label: "Complete" },
    ];

    const currentIndex = steps.findIndex((s) => s.key === step);

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, idx) => (
          <div key={s.key} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                idx < currentIndex && "bg-success text-white",
                idx === currentIndex && "bg-primary text-white",
                idx > currentIndex && "bg-slate-200 text-slate-500"
              )}
            >
              {idx < currentIndex ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                idx + 1
              )}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-1",
                  idx < currentIndex ? "bg-success" : "bg-slate-200"
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderContent = (): React.ReactNode => {
    switch (step) {
      case "select":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileSpreadsheet className="h-16 w-16 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">
                Import Data
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Select the type of data you want to import
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data Type
              </label>
              <Select
                options={entityOptions}
                value={entityType}
                onChange={(v) => {
                  setEntityType(v as ImportEntityType);
                }}
              />
            </div>

            <Card className="bg-slate-50 border-dashed">
              <CardBody className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Need a template?
                  </p>
                  <p className="text-xs text-slate-500">
                    Download our CSV template to get started
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={downloadTemplate}
                >
                  Download Template
                </Button>
              </CardBody>
            </Card>
          </div>
        );

      case "upload":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Upload className="h-16 w-16 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">
                Upload File
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Upload a CSV or Excel file with your {entityType} data
              </p>
            </div>

            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                file
                  ? "border-success bg-success-light"
                  : "border-slate-300 hover:border-primary"
              )}
            >
              {file ? (
                <div className="space-y-2">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • {fileData.length} rows
                    detected
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setFileData([]);
                      setColumns([]);
                    }}
                  >
                    Choose different file
                  </Button>
                </div>
              ) : (
                <>
                  {isTauri() ? (
                    <div
                      className="cursor-pointer space-y-2"
                      onClick={() => void handleNativeFileUpload()}
                    >
                      <Upload className="h-12 w-12 mx-auto text-slate-400" />
                      <p className="text-sm text-slate-600">
                        <span className="text-primary font-medium">
                          Click to select CSV file
                        </span>
                      </p>
                      <p className="text-xs text-slate-400">
                        CSV files supported
                      </p>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        className="hidden"
                        accept=".csv"
                        onChange={handleWebFileUpload}
                      />
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-slate-400" />
                        <p className="text-sm text-slate-600">
                          <span className="text-primary font-medium">
                            Click to upload
                          </span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-slate-400">
                          CSV files up to 10MB
                        </p>
                      </div>
                    </label>
                  )}
                </>
              )}
            </div>
          </div>
        );

      case "mapping":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Map Fields
              </h3>
              <p className="text-sm text-slate-500">
                Match your file columns to the corresponding fields
              </p>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-3">
              {columns.map((col) => {
                const mapping = mappings.find((m) => m.sourceColumn === col);
                const targetOptions: SelectOption[] = [
                  { value: "", label: "-- Skip this column --" },
                  ...targetFields.map((f) => ({
                    value: f.value,
                    label: f.label + (f.required ? " *" : ""),
                  })),
                ];

                return (
                  <div
                    key={col}
                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">
                        {col}
                      </p>
                      <p className="text-xs text-slate-400">
                        Sample:{" "}
                        {(() => {
                          const val = fileData[0]?.[col];
                          if (val === undefined || val === null) return "—";
                          if (typeof val === "object")
                            return JSON.stringify(val);
                          return String(val as string | number | boolean);
                        })()}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <div className="flex-1">
                      <Select
                        options={targetOptions}
                        value={mapping?.targetField ?? ""}
                        onChange={(v) => {
                          handleMappingChange(col, v);
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "preview":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Preview Import
              </h3>
              <p className="text-sm text-slate-500">
                Review the data before importing
              </p>
            </div>

            {preview && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardBody className="text-center py-4">
                      <p className="text-2xl font-bold text-slate-900">
                        {preview.totalRows}
                      </p>
                      <p className="text-xs text-slate-500">Total Rows</p>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody className="text-center py-4">
                      <p className="text-2xl font-bold text-success">
                        {preview.validRows}
                      </p>
                      <p className="text-xs text-slate-500">Valid</p>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody className="text-center py-4">
                      <p className="text-2xl font-bold text-error">
                        {preview.invalidRows}
                      </p>
                      <p className="text-xs text-slate-500">Invalid</p>
                    </CardBody>
                  </Card>
                </div>

                {preview.errors.length > 0 && (
                  <Card className="bg-error-light border-error">
                    <CardBody>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-error">
                            Validation Errors
                          </p>
                          <ul className="text-xs text-error mt-1 space-y-1">
                            {preview.errors.slice(0, 5).map((err, idx) => (
                              <li key={idx}>
                                Row {err.row}: {err.message}
                              </li>
                            ))}
                            {preview.errors.length > 5 && (
                              <li>...and {preview.errors.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
                    Preview (first 5 rows)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          {mappings
                            .filter((m) => m.targetField)
                            .map((m) => (
                              <th
                                key={m.targetField}
                                className="px-4 py-2 text-left font-medium text-slate-600"
                              >
                                {targetFields.find(
                                  (f) => f.value === m.targetField
                                )?.label ?? m.targetField}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {preview.previewData.map((row, idx) => (
                          <tr key={idx}>
                            {mappings
                              .filter((m) => m.targetField)
                              .map((m) => (
                                <td
                                  key={m.targetField}
                                  className="px-4 py-2 text-slate-600"
                                >
                                  {(() => {
                                    const val = row[m.sourceColumn];
                                    if (val === undefined || val === null)
                                      return "—";
                                    if (typeof val === "object")
                                      return JSON.stringify(val);
                                    return String(
                                      val as string | number | boolean
                                    );
                                  })()}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "result":
        return (
          <div className="text-center space-y-6">
            {result?.success ? (
              <>
                <CheckCircle2 className="h-20 w-20 mx-auto text-success" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    Import Complete!
                  </h3>
                  <p className="text-slate-500 mt-1">
                    Successfully imported {result.imported} records
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <Badge variant="success" size="lg">
                    {result.imported} Imported
                  </Badge>
                  {result.skipped > 0 && (
                    <Badge variant="warning" size="lg">
                      {result.skipped} Skipped
                    </Badge>
                  )}
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-20 w-20 mx-auto text-error" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    Import Failed
                  </h3>
                  <p className="text-slate-500 mt-1">
                    Please check your data and try again
                  </p>
                </div>
                {result?.errors && result.errors.length > 0 && (
                  <Card className="bg-error-light text-left">
                    <CardBody>
                      <ul className="text-sm text-error space-y-1">
                        {result.errors.slice(0, 5).map((err, idx) => (
                          <li key={idx}>{err.message}</li>
                        ))}
                      </ul>
                    </CardBody>
                  </Card>
                )}
              </>
            )}
          </div>
        );
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case "select":
        return true;
      case "upload":
        return !!(file && fileData.length > 0);
      case "mapping":
        return mappings.some((m) => m.targetField === "name");
      case "preview":
        return !!(preview && preview.validRows > 0);
      default:
        return false;
    }
  };

  const handleNext = (): void => {
    switch (step) {
      case "select":
        setStep("upload");
        break;
      case "upload":
        setStep("mapping");
        break;
      case "mapping":
        generatePreview();
        setStep("preview");
        break;
      case "preview":
        void handleImport();
        break;
    }
  };

  const handleBack = (): void => {
    switch (step) {
      case "upload":
        setStep("select");
        break;
      case "mapping":
        setStep("upload");
        break;
      case "preview":
        setStep("mapping");
        break;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Data" size="lg">
      <div className="py-4">
        {renderStepIndicator()}
        {renderContent()}
      </div>

      <div className="flex justify-between pt-4 border-t">
        {step !== "select" && step !== "result" ? (
          <Button
            variant="ghost"
            onClick={handleBack}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        {step === "result" ? (
          <Button onClick={handleClose}>Done</Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            isLoading={isProcessing}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            {step === "preview" ? "Import" : "Next"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
