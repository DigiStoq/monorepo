import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  Modal,
  Button,
  Select,
  type SelectOption,
  Card,
  CardBody,
  Badge,
} from "@/components/ui";
import {
  HardDrive,
  Cloud,
  CheckCircle2,
  Loader2,
  Download,
  Clock,
  Database,
  AlertTriangle,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

import type { BackupOptions, BackupResult, BackupRecord } from "../types";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackup: (options: BackupOptions) => Promise<BackupResult>;
  lastBackup?: BackupRecord;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const cloudProviderOptions: SelectOption[] = [
  { value: "google-drive", label: "Google Drive" },
  { value: "dropbox", label: "Dropbox" },
  { value: "onedrive", label: "OneDrive" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function BackupModal({
  isOpen,
  onClose,
  onBackup,
  lastBackup,
}: BackupModalProps): React.ReactNode {
  const [destination, setDestination] = useState<"local" | "cloud">("local");
  const [cloudProvider, setCloudProvider] = useState<string>("google-drive");
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [compress, setCompress] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BackupResult | null>(null);

  const handleBackup = async (): Promise<void> => {
    setIsProcessing(true);
    try {
      const backupResult = await onBackup({
        destination,
        cloudProvider:
          destination === "cloud"
            ? (cloudProvider as "google-drive" | "dropbox" | "onedrive")
            : undefined,
        includeAttachments,
        compress,
      });
      setResult(backupResult);
    } catch {
      setResult({
        success: false,
        filename: "",
        size: 0,
        timestamp: "",
        destination: "",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = (): void => {
    setResult(null);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (result) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Backup Complete"
        size="sm"
      >
        <div className="py-8 text-center space-y-6">
          {result.success ? (
            <>
              <div className="w-20 h-20 mx-auto bg-success-light rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Backup Successful!
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Your data has been safely backed up
                </p>
              </div>
              <Card className="text-left">
                <CardBody className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Filename</span>
                    <span className="font-medium text-slate-900">
                      {result.filename}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Size</span>
                    <span className="font-medium text-slate-900">
                      {formatFileSize(result.size)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Destination</span>
                    <span className="font-medium text-slate-900">
                      {result.destination}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Created</span>
                    <span className="font-medium text-slate-900">
                      {formatDate(result.timestamp)}
                    </span>
                  </div>
                </CardBody>
              </Card>
              {destination === "local" && (
                <Button leftIcon={<Download className="h-4 w-4" />}>
                  Download Backup
                </Button>
              )}
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto bg-error-light rounded-full flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Backup Failed
                </h3>
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Backup"
      size="md"
    >
      <div className="space-y-6 py-4">
        {/* Last Backup Info */}
        {lastBackup && (
          <Card className="bg-slate-50">
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-slate-200 rounded-xl">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">
                  Last Backup
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(lastBackup.timestamp)} •{" "}
                  {formatFileSize(lastBackup.size)} • {lastBackup.destination}
                </p>
              </div>
              <Badge
                variant={lastBackup.status === "success" ? "success" : "error"}
              >
                {lastBackup.status === "success" ? "Successful" : "Failed"}
              </Badge>
            </CardBody>
          </Card>
        )}

        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Backup Destination
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setDestination("local");
              }}
              className={cn(
                "p-4 rounded-xl border-2 text-center transition-all",
                destination === "local"
                  ? "border-primary bg-primary-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <HardDrive className="h-8 w-8 mx-auto mb-2 text-slate-600" />
              <p className="font-medium text-slate-900">Local Storage</p>
              <p className="text-xs text-slate-500 mt-1">
                Download to your device
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setDestination("cloud");
              }}
              className={cn(
                "p-4 rounded-xl border-2 text-center transition-all",
                destination === "cloud"
                  ? "border-primary bg-primary-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <Cloud className="h-8 w-8 mx-auto mb-2 text-slate-600" />
              <p className="font-medium text-slate-900">Cloud Storage</p>
              <p className="text-xs text-slate-500 mt-1">
                Save to cloud provider
              </p>
            </button>
          </div>
        </div>

        {/* Cloud Provider Selection */}
        {destination === "cloud" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cloud Provider
            </label>
            <Select
              options={cloudProviderOptions}
              value={cloudProvider}
              onChange={setCloudProvider}
            />
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Backup Options
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={includeAttachments}
              onChange={(e) => {
                setIncludeAttachments(e.target.checked);
              }}
              className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
            />
            <div>
              <p className="text-sm font-medium text-slate-700">
                Include Attachments
              </p>
              <p className="text-xs text-slate-500">
                Include uploaded files and images
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={compress}
              onChange={(e) => {
                setCompress(e.target.checked);
              }}
              className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
            />
            <div>
              <p className="text-sm font-medium text-slate-700">
                Compress Backup
              </p>
              <p className="text-xs text-slate-500">
                Create a smaller ZIP file
              </p>
            </div>
          </label>
        </div>

        {/* What's Included */}
        <Card className="bg-blue-50 border-blue-200">
          <CardBody className="flex items-start gap-3">
            <Database className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                What&apos;s included in the backup
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-0.5 list-disc list-inside">
                <li>All customers and items</li>
                <li>Invoices, payments, and expenses</li>
                <li>Settings and preferences</li>
                {includeAttachments && <li>Uploaded files and attachments</li>}
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            void handleBackup();
          }}
          disabled={isProcessing}
          leftIcon={
            isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <HardDrive className="h-4 w-4" />
            )
          }
        >
          {isProcessing ? "Creating Backup..." : "Create Backup"}
        </Button>
      </div>
    </Modal>
  );
}
