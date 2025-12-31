import { useState } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/layout";
import { Card, CardBody, Button } from "@/components/ui";
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
import {
  ImportWizard,
  ExportModal,
  BulkUpdateModal,
  BackupModal,
  RestoreWizard,
} from "./components";
import type {
  ImportEntityType,
  ExportOptions,
  BulkUpdateType,
  ImportResult,
  ExportResult,
  BulkUpdateResult,
} from "./types";

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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

  // Mock data for bulk update
  const mockSelectedItems = [
    { id: "1", name: "Widget A", salePrice: 29.99, purchasePrice: 15.0 },
    { id: "2", name: "Widget B", salePrice: 39.99, purchasePrice: 20.0 },
    { id: "3", name: "Widget C", salePrice: 49.99, purchasePrice: 25.0 },
  ];

  const mockCategories = [
    { id: "cat-1", name: "Electronics" },
    { id: "cat-2", name: "Office Supplies" },
    { id: "cat-3", name: "Hardware" },
    { id: "cat-4", name: "Software" },
  ];

  // Mock handlers
  const handleImport = async (
    _entityType: ImportEntityType,
    _data: Record<string, unknown>[]
  ): Promise<ImportResult> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      success: true,
      imported: _data.length,
      skipped: 0,
      errors: [],
    };
  };

  const handleExport = async (
    options: ExportOptions
  ): Promise<ExportResult> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const filename = `${options.entityType}-export-${new Date().toISOString().slice(0, 10)}.${options.format}`;
    return {
      success: true,
      filename,
      recordCount: Math.floor(Math.random() * 500) + 50,
      fileSize: Math.floor(Math.random() * 500000) + 10000,
    };
  };

  const handleBulkUpdate = async (
    _type: BulkUpdateType,
    _config: unknown
  ): Promise<BulkUpdateResult> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      success: true,
      updated: mockSelectedItems.length,
      failed: 0,
      errors: [],
    };
  };

  const handleBackup = async (_options: {
    destination: "local" | "cloud";
    cloudProvider?: string | undefined;
    includeAttachments: boolean;
    compress: boolean;
  }): Promise<BackupResult> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      success: true,
      filename: `digistoq-backup-${new Date().toISOString().slice(0, 10)}.zip`,
      size: 15728640, // 15 MB
      timestamp: new Date().toISOString(),
      destination:
        _options.destination === "local" ? "Local Storage" : "Google Drive",
    };
  };

  const handleRestore = async (_options: {
    source: "local" | "cloud";
    backupId?: string | undefined;
    file?: File | undefined;
    overwriteExisting: boolean;
  }): Promise<RestoreResult> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return {
      success: true,
      recordsRestored: 1247,
      timestamp: new Date().toISOString(),
    };
  };

  // Mock data for available cloud backups
  const mockCloudBackups = [
    {
      id: "bk-1",
      filename: "digistoq-backup-2024-01-15.zip",
      size: 12582912,
      createdAt: "2024-01-15T10:30:00Z",
      source: "cloud" as const,
      provider: "Google Drive",
    },
    {
      id: "bk-2",
      filename: "digistoq-backup-2024-01-08.zip",
      size: 11534336,
      createdAt: "2024-01-08T14:15:00Z",
      source: "cloud" as const,
      provider: "Google Drive",
    },
    {
      id: "bk-3",
      filename: "digistoq-backup-2024-01-01.zip",
      size: 10485760,
      createdAt: "2024-01-01T09:00:00Z",
      source: "cloud" as const,
      provider: "Google Drive",
    },
  ];

  const mockLastBackup = {
    timestamp: "2024-01-15T10:30:00Z",
    size: 12582912,
    destination: "Google Drive",
    status: "success" as const,
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
        setIsBackupOpen(true);
      },
    },
    {
      id: "restore",
      title: "Restore Data",
      description: "Restore data from a previous backup",
      icon: <RefreshCw className="h-6 w-6" />,
      color: "bg-orange-500",
      action: () => {
        setIsRestoreOpen(true);
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
        selectedItems={mockSelectedItems}
        categories={mockCategories}
        onUpdate={handleBulkUpdate}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => {
          setIsBackupOpen(false);
        }}
        onBackup={handleBackup}
        lastBackup={mockLastBackup}
      />

      <RestoreWizard
        isOpen={isRestoreOpen}
        onClose={() => {
          setIsRestoreOpen(false);
        }}
        onRestore={handleRestore}
        availableBackups={mockCloudBackups}
      />
    </>
  );
}
