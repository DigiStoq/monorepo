import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  Modal,
  Button,
  Card,
  CardBody,
  Badge,
} from "@/components/ui";
import {
  Upload,
  Cloud,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  FileArchive,
  Calendar,
  Database,
  Trash2,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface RestoreWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (options: RestoreOptions) => Promise<RestoreResult>;
  availableBackups?: BackupFile[];
}

interface RestoreOptions {
  source: "local" | "cloud";
  backupId?: string | undefined;
  file?: File | undefined;
  overwriteExisting: boolean;
}

interface RestoreResult {
  success: boolean;
  recordsRestored: number;
  timestamp: string;
  errors?: string[];
}

interface BackupFile {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  source: "local" | "cloud";
  provider?: string;
}

type WizardStep = "source" | "select" | "confirm" | "result";

// ============================================================================
// COMPONENT
// ============================================================================

export function RestoreWizard({
  isOpen,
  onClose,
  onRestore,
  availableBackups = [],
}: RestoreWizardProps) {
  const [step, setStep] = useState<WizardStep>("source");
  const [source, setSource] = useState<"local" | "cloud">("local");
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RestoreResult | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      const restoreResult = await onRestore({
        source,
        backupId: selectedBackup?.id,
        file: uploadedFile || undefined,
        overwriteExisting,
      });
      setResult(restoreResult);
      setStep("result");
    } catch {
      setResult({
        success: false,
        recordsRestored: 0,
        timestamp: new Date().toISOString(),
        errors: ["Restore failed. Please try again."],
      });
      setStep("result");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep("source");
    setSource("local");
    setSelectedBackup(null);
    setUploadedFile(null);
    setOverwriteExisting(false);
    setResult(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cloudBackups = availableBackups.filter((b) => b.source === "cloud");

  const canProceed = () => {
    switch (step) {
      case "source":
        return true;
      case "select":
        return source === "local" ? !!uploadedFile : !!selectedBackup;
      case "confirm":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    switch (step) {
      case "source":
        setStep("select");
        break;
      case "select":
        setStep("confirm");
        break;
      case "confirm":
        handleRestore();
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case "select":
        setStep("source");
        break;
      case "confirm":
        setStep("select");
        break;
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: "source", label: "Source" },
      { key: "select", label: "Select Backup" },
      { key: "confirm", label: "Confirm" },
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
              {idx < currentIndex ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
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

  const renderContent = () => {
    switch (step) {
      case "source":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <RefreshCw className="h-16 w-16 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">Restore Data</h3>
              <p className="text-sm text-slate-500 mt-1">
                Choose where to restore your backup from
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSource("local")}
                className={cn(
                  "p-6 rounded-xl border-2 text-center transition-all",
                  source === "local"
                    ? "border-primary bg-primary-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <HardDrive className="h-10 w-10 mx-auto mb-3 text-slate-600" />
                <p className="font-semibold text-slate-900">Local File</p>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a backup file from your device
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSource("cloud")}
                className={cn(
                  "p-6 rounded-xl border-2 text-center transition-all",
                  source === "cloud"
                    ? "border-primary bg-primary-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <Cloud className="h-10 w-10 mx-auto mb-3 text-slate-600" />
                <p className="font-semibold text-slate-900">Cloud Storage</p>
                <p className="text-xs text-slate-500 mt-1">
                  Restore from a cloud backup
                </p>
                {cloudBackups.length > 0 && (
                  <Badge variant="info" size="sm" className="mt-2">
                    {cloudBackups.length} backups available
                  </Badge>
                )}
              </button>
            </div>
          </div>
        );

      case "select":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                {source === "local" ? "Upload Backup File" : "Select Cloud Backup"}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {source === "local"
                  ? "Choose a backup file to restore"
                  : "Select a backup from your cloud storage"}
              </p>
            </div>

            {source === "local" ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                  uploadedFile ? "border-success bg-success-light" : "border-slate-300 hover:border-primary"
                )}
              >
                {uploadedFile ? (
                  <div className="space-y-2">
                    <FileArchive className="h-12 w-12 mx-auto text-success" />
                    <p className="font-medium text-slate-900">{uploadedFile.name}</p>
                    <p className="text-sm text-slate-500">
                      {formatFileSize(uploadedFile.size)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                    >
                      Choose different file
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      className="hidden"
                      accept=".zip,.backup"
                      onChange={handleFileUpload}
                    />
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-slate-400" />
                      <p className="text-sm text-slate-600">
                        <span className="text-primary font-medium">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-400">ZIP or .backup files</p>
                    </div>
                  </label>
                )}
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {cloudBackups.length > 0 ? (
                  cloudBackups.map((backup) => (
                    <button
                      key={backup.id}
                      type="button"
                      onClick={() => setSelectedBackup(backup)}
                      className={cn(
                        "w-full p-4 rounded-lg border-2 text-left transition-all",
                        selectedBackup?.id === backup.id
                          ? "border-primary bg-primary-50"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <FileArchive className="h-8 w-8 text-slate-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{backup.filename}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(backup.createdAt)}
                            </span>
                            <span>{formatFileSize(backup.size)}</span>
                            {backup.provider && (
                              <Badge variant="secondary" size="sm">{backup.provider}</Badge>
                            )}
                          </div>
                        </div>
                        {selectedBackup?.id === backup.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <Card className="bg-slate-50">
                    <CardBody className="text-center py-8">
                      <Cloud className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500">No cloud backups found</p>
                    </CardBody>
                  </Card>
                )}
              </div>
            )}
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-warning mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">Confirm Restore</h3>
              <p className="text-sm text-slate-500 mt-1">
                Please review and confirm the restore operation
              </p>
            </div>

            <Card>
              <CardBody className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Source</span>
                  <span className="font-medium text-slate-900 capitalize">{source}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">File</span>
                  <span className="font-medium text-slate-900">
                    {source === "local" ? uploadedFile?.name : selectedBackup?.filename}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Size</span>
                  <span className="font-medium text-slate-900">
                    {formatFileSize(source === "local" ? uploadedFile?.size || 0 : selectedBackup?.size || 0)}
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-warning-light border-warning">
              <CardBody className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warning-dark">Important</p>
                  <p className="text-xs text-warning-dark mt-1">
                    This will restore data from the backup. Make sure you have a current backup before proceeding.
                  </p>
                </div>
              </CardBody>
            </Card>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={overwriteExisting}
                onChange={(e) => setOverwriteExisting(e.target.checked)}
                className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
              />
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-error" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Overwrite existing data</p>
                  <p className="text-xs text-slate-500">Delete current data before restoring</p>
                </div>
              </div>
            </label>
          </div>
        );

      case "result":
        return (
          <div className="text-center space-y-6">
            {result?.success ? (
              <>
                <CheckCircle2 className="h-20 w-20 mx-auto text-success" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Restore Complete!</h3>
                  <p className="text-slate-500 mt-1">
                    Successfully restored {result.recordsRestored.toLocaleString()} records
                  </p>
                </div>
                <Card>
                  <CardBody className="flex items-center justify-center gap-4">
                    <Database className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="text-2xl font-bold text-slate-900">
                        {result.recordsRestored.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">Records Restored</p>
                    </div>
                  </CardBody>
                </Card>
              </>
            ) : (
              <>
                <AlertTriangle className="h-20 w-20 mx-auto text-error" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Restore Failed</h3>
                  <p className="text-slate-500 mt-1">
                    There was an error restoring your data
                  </p>
                </div>
                {result?.errors && result.errors.length > 0 && (
                  <Card className="bg-error-light text-left">
                    <CardBody>
                      <ul className="text-sm text-error space-y-1">
                        {result.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Restore Data"
      size="lg"
    >
      <div className="py-4">
        {renderStepIndicator()}
        {renderContent()}
      </div>

      <div className="flex justify-between pt-4 border-t">
        {step !== "source" && step !== "result" ? (
          <Button variant="ghost" onClick={handleBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
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
            {step === "confirm" ? "Restore" : "Next"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
