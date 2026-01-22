// ============================================================================
// Settings Types
// ============================================================================

// Company Settings (nested structure for UI)
export interface CompanySettings {
  id: string;
  name: string;
  legalName?: string;
  logo?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  registration: {
    taxId?: string;
    ein?: string;
  };
  financialYear: {
    startMonth: number; // 1-12 (e.g., 4 for April)
    startDay: number;
  };
  currency: string;
  locale: string;
  timezone: string;
}

// Company Settings (flat structure for database operations)
export interface FlatCompanySettings {
  id: string;
  name: string;
  legalName?: string;
  logoUrl?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWebsite?: string;
  taxId?: string;
  ein?: string;
  financialYearStartMonth: number;
  financialYearStartDay: number;
  currency: string;
  locale: string;
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
}

// User Profile
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  language: string;
  notifications: NotificationPreferences;
  createdAt: string;
  lastLogin?: string;
}

export type UserRole = "owner" | "admin" | "manager" | "staff" | "accountant";

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  invoiceReminders: boolean;
  paymentAlerts: boolean;
  lowStockAlerts: boolean;
  weeklyReports: boolean;
}

// App Preferences
export interface AppPreferences {
  theme: "light" | "dark" | "system";
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  defaultInvoiceTerms: number; // days
  defaultPaymentTerms: string;
  showDashboardWidgets: DashboardWidget[];
  compactMode: boolean;
  autoSave: boolean;
  printSettings: PrintSettings;
}

export type DateFormat =
  | "DD/MM/YYYY"
  | "MM/DD/YYYY"
  | "YYYY-MM-DD"
  | "DD-MMM-YYYY";

export interface NumberFormat {
  decimalSeparator: "." | ",";
  thousandsSeparator: "," | "." | " ";
  decimalPlaces: number;
}

export type DashboardWidget =
  | "sales-chart"
  | "receivables"
  | "payables"
  | "recent-transactions"
  | "low-stock-alerts"
  | "quick-actions"
  | "bank-balance"
  | "monthly-comparison";

export interface PrintSettings {
  paperSize: "A4" | "Letter" | "Legal";
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showLogo: boolean;
  showSignature: boolean;
  showTerms: boolean;
}

// Tax Settings
export interface TaxSettings {
  taxEnabled: boolean;
  defaultTaxRate: number;
  taxRates: TaxRate[];
  taxInclusive: boolean;
  roundTax: boolean;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: "percentage" | "fixed";
  description?: string;
  isDefault: boolean;
  isActive: boolean;
}

// PDF Template options
export type PDFTemplateId = "classic" | "modern" | "minimal";

// Invoice Settings
export interface InvoiceSettings {
  id?: string;
  prefix: string;
  nextNumber: number;
  padding: number; // e.g., 4 for INV-0001
  termsAndConditions?: string;
  notes?: string;
  showPaymentQR?: boolean;
  showPaymentQr?: boolean; // DB uses lowercase 'r'
  showBankDetails: boolean;
  bankDetails?: BankDetails;
  // Flat bank fields from database
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankRoutingNumber?: string;
  bankBranchName?: string;
  bankSwiftCode?: string;
  dueDateDays: number;
  lateFeesEnabled: boolean;
  lateFeesPercentage?: number;
  pdfTemplate: PDFTemplateId;
  taxEnabled: boolean;
  taxInclusive: boolean;
  roundTax: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  routingNumber: string;
  branchName?: string;
  swiftCode?: string;
}

// Security Settings
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod?: "app" | "sms" | "email";
  sessionTimeout: number; // minutes
  requirePasswordChange: boolean;
  passwordChangeDays?: number;
  allowedIPs?: string[];
  loginHistory: LoginRecord[];
}

export interface LoginRecord {
  id: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  success: boolean;
}

// Backup Settings
export interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
  backupTime: string; // HH:mm
  retentionDays: number;
  backupDestination: "local" | "cloud" | "both";
  cloudProvider?: "google-drive" | "dropbox" | "onedrive";
  lastBackup?: string;
  backupHistory: BackupRecord[];
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  size: number; // bytes
  destination: string;
  status: "success" | "failed" | "in-progress";
  errorMessage?: string;
}

// Settings Section Navigation
// ts-prune-ignore-next (exported for future settings navigation feature)
export interface SettingsSection {
  id: string;
  label: string;
  description: string;
  icon: string;
  path: string;
}

// Combined Settings State
// ts-prune-ignore-next (exported for future unified settings management)
export interface AllSettings {
  company: CompanySettings;
  user: UserProfile;
  preferences: AppPreferences;
  tax: TaxSettings;
  invoice: InvoiceSettings;
  security: SecuritySettings;
  backup: BackupSettings;
}
