import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
} from "@tanstack/react-router";
import { RootLayout } from "./__root";
import { useAuthStore } from "@/stores";

// Auth page imports
import { LoginPage, SignupPage, ForgotPasswordPage } from "@/features/auth";

// Page imports
import { DashboardPage } from "@/features/dashboard";
import { CustomersPage } from "@/features/customers";
import { ItemsPage } from "@/features/inventory";
import { SaleInvoicesPage, PaymentInPage, CreditNotesPage, EstimatesPage } from "@/features/sales";
import { PurchaseInvoicesPage, PaymentOutPage, ExpensesPage } from "@/features/purchases";
import { BankAccountsPage, CashInHandPage, ChequesPage, LoansPage } from "@/features/cash-bank";
import {
  ReportsHubPage,
  SalesSummaryReport,
  SalesRegisterReport,
  SalesByItemReport,
  SalesByCustomerReport,
  PurchaseSummaryReport,
  PurchaseRegisterReport,
  PurchaseByItemReport,
  PurchaseBySupplierReport,
  CustomerStatementReport,
  ReceivablesReport,
  PayablesReport,
  AgingReport,
  StockSummaryReport,
  StockMovementReport,
  LowStockReport,
  ItemProfitabilityReport,
  DayBookReport,
  ProfitLossReportPage,
  CashFlowReportPage,
  CashMovementReportPage,
  TaxSummaryReport,
} from "@/features/reports";
import {
  SettingsPage,
  CompanySettingsPage,
  UserProfilePage,
  PreferencesPage,
  TaxInvoiceSettingsPage,
  SecuritySettingsPage,
  BackupSettingsPage,
} from "@/features/settings";
import { UtilitiesPage } from "@/features/utilities";

// Placeholder pages (will be replaced with actual implementations)
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-500">This page is under construction.</p>
      </div>
    </div>
  );
}

// ============================================================================
// AUTH GUARDS
// ============================================================================

// Check if user is authenticated - redirect to login if not
function requireAuth() {
  const { isAuthenticated, isInitialized } = useAuthStore.getState();

  // If not initialized, we're still loading - don't redirect yet
  if (!isInitialized) {
    return;
  }

  if (!isAuthenticated) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router redirect pattern
    throw redirect({ to: "/login" });
  }
}

// Redirect authenticated users away from auth pages
function redirectIfAuthenticated() {
  const { isAuthenticated, isInitialized } = useAuthStore.getState();

  if (!isInitialized) {
    return;
  }

  if (isAuthenticated) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router redirect pattern
    throw redirect({ to: "/" });
  }
}

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================

// Root route (for all routes - used as base)
const rootRoute = createRootRoute();

// Auth routes (public - no sidebar layout)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
  beforeLoad: redirectIfAuthenticated,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupPage,
  beforeLoad: redirectIfAuthenticated,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
  beforeLoad: redirectIfAuthenticated,
});

// Protected layout route (with sidebar)
const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: RootLayout,
  beforeLoad: requireAuth,
});

// Dashboard (Index)
const indexRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/",
  component: DashboardPage,
});

// Customers
const customersRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/customers",
  component: CustomersPage,
});

// Items
const itemsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/items",
  component: ItemsPage,
});

// Sale routes
const saleInvoicesRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/sale/invoices",
  component: SaleInvoicesPage,
});

const saleEstimatesRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/sale/estimates",
  component: EstimatesPage,
});

const salePaymentInRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/sale/payment-in",
  component: PaymentInPage,
});

const saleCreditNotesRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/sale/credit-notes",
  component: CreditNotesPage,
});

// Purchase routes
const purchaseInvoicesRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/purchase/invoices",
  component: PurchaseInvoicesPage,
});

const purchasePaymentOutRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/purchase/payment-out",
  component: PaymentOutPage,
});

const purchaseExpensesRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/purchase/expenses",
  component: ExpensesPage,
});

// Cash & Bank routes
const bankAccountsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/cash-bank/accounts",
  component: BankAccountsPage,
});

const cashInHandRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/cash-bank/cash",
  component: CashInHandPage,
});

const chequesRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/cash-bank/cheques",
  component: ChequesPage,
});

const loansRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/cash-bank/loans",
  component: LoansPage,
});

// ============================================================================
// REPORTS ROUTES
// ============================================================================

// Reports Hub
const reportsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports",
  component: ReportsHubPage,
});

// Sales Reports
const salesSummaryReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/sales/summary",
  component: SalesSummaryReport,
});

const salesRegisterReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/sales/register",
  component: SalesRegisterReport,
});

const salesByItemReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/sales/items",
  component: SalesByItemReport,
});

const salesByCustomerReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/sales/customers",
  component: SalesByCustomerReport,
});

// Purchase Reports
const purchaseSummaryReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/purchases/summary",
  component: PurchaseSummaryReport,
});

const purchaseRegisterReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/purchases/register",
  component: PurchaseRegisterReport,
});

const purchaseByItemReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/purchases/items",
  component: PurchaseByItemReport,
});

const purchaseBySupplierReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/purchases/suppliers",
  component: PurchaseBySupplierReport,
});

// Customer Reports
const customerStatementReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/customers/statement",
  component: CustomerStatementReport,
});

const receivablesReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/customers/receivables",
  component: ReceivablesReport,
});

const payablesReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/customers/payables",
  component: PayablesReport,
});

const agingReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/customers/aging",
  component: AgingReport,
});

// Inventory Reports
const stockSummaryReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/inventory/stock-summary",
  component: StockSummaryReport,
});

const stockMovementReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/inventory/movement",
  component: StockMovementReport,
});

const lowStockReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/inventory/low-stock",
  component: LowStockReport,
});

const itemProfitabilityReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/inventory/profitability",
  component: ItemProfitabilityReport,
});

// Financial Reports
const dayBookReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/financial/daybook",
  component: DayBookReport,
});

const profitLossReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/financial/profit-loss",
  component: ProfitLossReportPage,
});

const cashFlowReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/financial/cash-flow",
  component: CashFlowReportPage,
});

const cashMovementReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/financial/cash-movement",
  component: CashMovementReportPage,
});

const taxSummaryReportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/reports/financial/tax-summary",
  component: TaxSummaryReport,
});

// ============================================================================
// OTHER ROUTES
// ============================================================================

// ============================================================================
// SETTINGS ROUTES
// ============================================================================

// Settings Hub
const settingsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/settings",
  component: SettingsPage,
});

// Company Settings
const companySettingsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/settings/company",
  component: CompanySettingsPage,
});

// User Profile
const userProfileRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/settings/profile",
  component: UserProfilePage,
});

// Preferences
const preferencesRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/settings/preferences",
  component: PreferencesPage,
});

// Tax & Invoice Settings
const taxInvoiceRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/settings/tax",
  component: TaxInvoiceSettingsPage,
});

// Security Settings
const securitySettingsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/settings/security",
  component: SecuritySettingsPage,
});

// Backup & Data Settings
const backupSettingsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/settings/backup",
  component: BackupSettingsPage,
});

// Utilities
const utilitiesRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/utilities",
  component: UtilitiesPage,
});

// Help
const helpRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/help",
  component: () => <PlaceholderPage title="Help & Support" />,
});

// ============================================================================
// ROUTE TREE
// ============================================================================

// Protected routes (nested under protected layout)
const protectedRoutes = protectedLayoutRoute.addChildren([
  indexRoute,
  customersRoute,
  itemsRoute,
  // Sale
  saleInvoicesRoute,
  saleEstimatesRoute,
  salePaymentInRoute,
  saleCreditNotesRoute,
  // Purchase
  purchaseInvoicesRoute,
  purchasePaymentOutRoute,
  purchaseExpensesRoute,
  // Cash & Bank
  bankAccountsRoute,
  cashInHandRoute,
  chequesRoute,
  loansRoute,
  // Reports Hub
  reportsRoute,
  // Sales Reports
  salesSummaryReportRoute,
  salesRegisterReportRoute,
  salesByItemReportRoute,
  salesByCustomerReportRoute,
  // Purchase Reports
  purchaseSummaryReportRoute,
  purchaseRegisterReportRoute,
  purchaseByItemReportRoute,
  purchaseBySupplierReportRoute,
  // Customer Reports
  customerStatementReportRoute,
  receivablesReportRoute,
  payablesReportRoute,
  agingReportRoute,
  // Inventory Reports
  stockSummaryReportRoute,
  stockMovementReportRoute,
  lowStockReportRoute,
  itemProfitabilityReportRoute,
  // Financial Reports
  dayBookReportRoute,
  profitLossReportRoute,
  cashFlowReportRoute,
  cashMovementReportRoute,
  taxSummaryReportRoute,
  // Settings
  settingsRoute,
  companySettingsRoute,
  userProfileRoute,
  preferencesRoute,
  taxInvoiceRoute,
  securitySettingsRoute,
  backupSettingsRoute,
  // Utilities
  utilitiesRoute,
  // Other
  helpRoute,
]);

// Full route tree with auth and protected routes
const routeTree = rootRoute.addChildren([
  // Auth routes (public)
  loginRoute,
  signupRoute,
  forgotPasswordRoute,
  // Protected routes (require auth)
  protectedRoutes,
]);

// ============================================================================
// ROUTER INSTANCE
// ============================================================================

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

// Type declaration for router
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
