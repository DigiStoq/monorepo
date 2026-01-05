import { useState } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/layout";
import { Card, CardBody, Button } from "@/components/ui";
import { useNavigate } from "@tanstack/react-router";
import {
  Upload,
  Download,
  Layers,
  Trash2,
  Database,
  RefreshCw,
  FileSpreadsheet,
  ArrowRight,
  Shield,
  HardDrive,
} from "lucide-react";
import { ImportWizard, ExportModal, BulkUpdateModal } from "./components";
import type {
  ImportEntityType,
  ExportOptions,
  BulkUpdateType,
  ImportResult,
  ExportResult,
  BulkUpdateResult,
} from "./types";
import { useDataExport, useDataImport, useBulkActions } from "@/hooks";

// ============================================================================
// TYPES
// ============================================================================

interface UtilityCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UtilitiesPage(): React.ReactNode {
  const navigate = useNavigate();
  const { exportData } = useDataExport();
  const { importData } = useDataImport();
  const { bulkUpdate } = useBulkActions();

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);

  // Mock data for bulk update items - in real app this would come from a selection context or picker
  // For now we keep the mock expectation for the modal, but the ACTION is real

  const mockCategories = [
    { id: "cat-1", name: "Electronics" },
    { id: "cat-2", name: "Office Supplies" },
    { id: "cat-3", name: "Hardware" },
    { id: "cat-4", name: "Software" },
  ];

  const handleImport = async (
    entityType: ImportEntityType,
    data: Record<string, unknown>[]
  ): Promise<ImportResult> => {
    return importData(entityType, data);
  };

  const handleExport = async (
    options: ExportOptions
  ): Promise<ExportResult> => {
    return exportData(options);
  };

  const handleBulkUpdate = async (
    type: BulkUpdateType,
    selectedIds: string[],
    config: unknown
  ): Promise<BulkUpdateResult> => {
    // The modal now handles selection, so we pass selectedIds directly to the hook
    return bulkUpdate(type, selectedIds, config);
  };

  const utilities: UtilityCard[] = [
    {
      id: "import",
      title: "Import Data",
      description: "Import customers, items, or invoices from CSV/Excel files",
      icon: <Upload className="h-6 w-6" />,
      color: "bg-blue-500",
      action: () => {
        setIsImportOpen(true);
      },
    },
    {
      id: "export",
      title: "Export Data",
      description: "Export your data to CSV, Excel, or PDF formats",
      icon: <Download className="h-6 w-6" />,
      color: "bg-green-500",
      action: () => {
        setIsExportOpen(true);
      },
    },
    {
      id: "bulk-update",
      title: "Bulk Updates",
      description:
        "Update prices, categories, or stock for multiple items at once",
      icon: <Layers className="h-6 w-6" />,
      color: "bg-purple-500",
      action: () => {
        setIsBulkUpdateOpen(true);
      },
    },
    {
      id: "backup",
      title: "Backup Data",
      description: "Create a backup of all your business data",
      icon: <HardDrive className="h-6 w-6" />,
      color: "bg-teal-500",
      action: () => {
        void navigate({ to: "/settings/backup" });
      },
    },
    {
      id: "restore",
      title: "Restore Data",
      description: "Restore data from a previous backup",
      icon: <RefreshCw className="h-6 w-6" />,
      color: "bg-orange-500",
      action: () => {
        void navigate({ to: "/settings/backup" });
      },
    },
    {
      id: "cleanup",
      title: "Data Cleanup",
      description:
        "Remove inactive customers, zero-stock items, or old transactions",
      icon: <Trash2 className="h-6 w-6" />,
      color: "bg-red-500",
      action: () => {
        // Will be implemented later
        alert("Data cleanup feature coming soon!");
      },
    },
  ];

  const quickActions = [
    {
      id: "template-customers",
      title: "Download Customer Template",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      action: () => {
        const template =
          "Name,Type,Phone,Email,Tax ID,Address,City,State,ZIP Code,Opening Balance,Credit Limit";
        const blob = new Blob([template], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "customers-template.csv";
        a.click();
        URL.revokeObjectURL(url);
      },
    },
    {
      id: "template-items",
      title: "Download Items Template",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      action: () => {
        const template =
          "Name,SKU,Description,Category,Sale Price,Purchase Price,Unit,Opening Stock,Min Stock,Tax Rate";
        const blob = new Blob([template], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "items-template.csv";
        a.click();
        URL.revokeObjectURL(url);
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Utilities"
        description="Import, export, and manage your business data"
      />

      <div className="p-6 space-y-8">
        {/* Main Utilities Grid */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Data Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {utilities.map((utility) => (
              <Card
                key={utility.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={utility.action}
              >
                <CardBody className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn("p-3 rounded-xl text-white", utility.color)}
                    >
                      {utility.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">
                          {utility.title}
                        </h3>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {utility.description}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h2>
          <Card>
            <CardBody className="p-4">
              <div className="flex flex-wrap gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    leftIcon={action.icon}
                    onClick={action.action}
                  >
                    {action.title}
                  </Button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardBody className="flex items-start gap-4 p-5">
              <div className="p-3 bg-blue-500 rounded-xl text-white">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  Data Import Tips
                </h3>
                <ul className="text-sm text-slate-600 mt-2 space-y-1 list-disc list-inside">
                  <li>Use CSV or Excel format for best results</li>
                  <li>Ensure column headers match our template</li>
                  <li>Required fields: Name (for customers & items)</li>
                  <li>Use consistent date format (YYYY-MM-DD)</li>
                </ul>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardBody className="flex items-start gap-4 p-5">
              <div className="p-3 bg-green-500 rounded-xl text-white">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Data Safety</h3>
                <ul className="text-sm text-slate-600 mt-2 space-y-1 list-disc list-inside">
                  <li>All data is encrypted in transit and at rest</li>
                  <li>Backups are stored securely</li>
                  <li>Data cleanup actions are reversible for 30 days</li>
                  <li>Export your data anytime for portability</li>
                </ul>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ImportWizard
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
        }}
        onImport={handleImport}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => {
          setIsExportOpen(false);
        }}
        onExport={handleExport}
      />

      <BulkUpdateModal
        isOpen={isBulkUpdateOpen}
        onClose={() => {
          setIsBulkUpdateOpen(false);
        }}
        categories={mockCategories}
        onUpdate={handleBulkUpdate}
      />
    </>
  );
}
