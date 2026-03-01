import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout";
import { Card, CardBody, Input } from "@/components/ui";
import {
  Search,
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  FileText,
  BarChart3,
  PieChart,
  LineChart,
  ArrowRight,
  Receipt,
  CreditCard,
  Wallet,
  AlertTriangle,
  Calendar,
  Building2,
  Boxes,
  Scale,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ============================================================================
// REPORT CATEGORIES DATA
// ============================================================================

const reportCategories = [
  {
    id: "sales",
    title: "Sales Reports",
    description: "Track sales performance, invoices, and customer analytics",
    icon: TrendingUp,
    color: "text-green-700",
    reports: [
      {
        id: "sales-summary",
        title: "Sales Summary",
        description: "Overview of sales by period",
        path: "/reports/sales/summary",
        icon: BarChart3,
      },
      {
        id: "sales-register",
        title: "Sales Register",
        description: "Detailed list of all sales",
        path: "/reports/sales/register",
        icon: FileText,
      },
      {
        id: "sales-by-customer",
        title: "Sales by Customer",
        description: "Customer-wise sales breakdown",
        path: "/reports/sales/customers",
        icon: Users,
      },
      {
        id: "sales-by-item",
        title: "Sales by Item",
        description: "Item-wise sales breakdown",
        path: "/reports/sales/items",
        icon: Package,
      },
    ],
  },
  {
    id: "purchases",
    title: "Purchase Reports",
    description: "Monitor purchases, expenses, and supplier transactions",
    icon: ShoppingCart,
    color: "text-orange-700",
    reports: [
      {
        id: "purchase-summary",
        title: "Purchase Summary",
        description: "Overview of purchases by period",
        path: "/reports/purchases/summary",
        icon: BarChart3,
      },
      {
        id: "purchase-register",
        title: "Purchase Register",
        description: "Detailed list of all purchases",
        path: "/reports/purchases/register",
        icon: FileText,
      },
      {
        id: "purchase-by-supplier",
        title: "Purchases by Supplier",
        description: "Supplier-wise purchase breakdown",
        path: "/reports/purchases/suppliers",
        icon: Building2,
      },
      {
        id: "expense-report",
        title: "Expense Report",
        description: "Category-wise expense breakdown",
        path: "/purchase/expenses",
        icon: Receipt,
      },
    ],
  },
  {
    id: "customers",
    title: "Customer Reports",
    description: "Customer and supplier statements, aging, and balances",
    icon: Users,
    color: "text-blue-700",
    reports: [
      {
        id: "customer-statement",
        title: "Customer Statement",
        description: "Detailed ledger for any customer",
        path: "/reports/customers/statement",
        icon: FileText,
      },
      {
        id: "receivables-aging",
        title: "Receivables Aging",
        description: "Customer outstanding by age",
        path: "/reports/customers/receivables",
        icon: AlertTriangle,
      },
      {
        id: "payables-aging",
        title: "Payables Aging",
        description: "Supplier outstanding by age",
        path: "/reports/customers/payables",
        icon: CreditCard,
      },
      {
        id: "customer-balance",
        title: "Balance Summary",
        description: "All customer balances at a glance",
        path: "/reports/customers/aging",
        icon: Scale,
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory Reports",
    description: "Stock levels, movements, and profitability analysis",
    icon: Package,
    color: "text-purple-700",
    reports: [
      {
        id: "stock-summary",
        title: "Stock Summary",
        description: "Current stock levels and values",
        path: "/reports/inventory/stock-summary",
        icon: Boxes,
      },
      {
        id: "stock-movement",
        title: "Stock Movement",
        description: "Stock in/out during period",
        path: "/reports/inventory/movement",
        icon: LineChart,
      },
      {
        id: "low-stock",
        title: "Low Stock Alert",
        description: "Items below reorder level",
        path: "/reports/inventory/low-stock",
        icon: AlertTriangle,
      },
      {
        id: "item-profitability",
        title: "Item Profitability",
        description: "Profit margins by item",
        path: "/reports/inventory/profitability",
        icon: PieChart,
      },
    ],
  },
  {
    id: "financial",
    title: "Financial Reports",
    description: "Profit & Loss, Cash Flow, and financial statements",
    icon: DollarSign,
    color: "text-teal-700",
    reports: [
      {
        id: "profit-loss",
        title: "Profit & Loss",
        description: "Revenue, expenses, and net profit",
        path: "/reports/financial/profit-loss",
        icon: BarChart3,
      },
      {
        id: "cash-flow",
        title: "Cash Flow Statement",
        description: "Cash inflows and outflows",
        path: "/reports/financial/cash-flow",
        icon: Wallet,
      },
      {
        id: "cash-movement",
        title: "Cash Movement",
        description: "Money flow by payment mode",
        path: "/reports/financial/cash-movement",
        icon: ArrowLeftRight,
      },
      {
        id: "day-book",
        title: "Day Book",
        description: "All transactions by date",
        path: "/reports/financial/daybook",
        icon: Calendar,
      },
      {
        id: "tax-summary",
        title: "Tax Summary",
        description: "Tax collected and paid summary",
        path: "/reports/financial/tax-summary",
        icon: Receipt,
      },
    ],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ReportsHubPage(): React.ReactNode {
  const [search, setSearch] = useState("");

  // Filter reports based on search
  const filteredCategories = reportCategories
    .map((category) => ({
      ...category,
      reports: category.reports.filter(
        (report) =>
          report.title.toLowerCase().includes(search.toLowerCase()) ||
          report.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(
      (category) =>
        search === "" ||
        category.title.toLowerCase().includes(search.toLowerCase()) ||
        category.reports.length > 0
    );

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Reports"
        description="Generate insights from your business data"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Search */}
        <div className="max-w-md mb-6">
          <Input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* Report Categories */}
        <div className="space-y-8">
          {filteredCategories.map((category) => {
            const CategoryIcon = category.icon;

            return (
              <div key={category.id}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-2 rounded-lg", category.color)}>
                    <CategoryIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-heading">
                      {category.title}
                    </h2>
                    <p className="text-sm text-text-tertiary">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* Report Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.reports.map((report) => {
                    const ReportIcon = report.icon;

                    return (
                      <Link key={report.id} to={report.path}>
                        <Card className="h-full cursor-pointer hover:shadow-md hover:border-primary-200 transition-all group">
                          <CardBody className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div
                                className={cn("p-2 rounded-lg", category.color)}
                              >
                                <ReportIcon className="h-4 w-4" />
                              </div>
                              <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                            </div>
                            <h3 className="font-medium text-text-heading mb-1">
                              {report.title}
                            </h3>
                            <p className="text-sm text-text-tertiary">
                              {report.description}
                            </p>
                          </CardBody>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <h3 className="text-lg font-medium text-text-heading mb-1">
              No reports found
            </h3>
            <p className="text-slate-500">Try adjusting your search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
