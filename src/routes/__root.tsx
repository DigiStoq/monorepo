import { useCallback, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import {
  AppShell,
  Sidebar,
  SidebarLogo,
  SidebarUser,
  type NavItem,
} from "@/components/layout";
import { ToastProvider } from "@/components/ui";
import { useUIStore, useAuthStore } from "@/stores";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  HelpCircle,
  Wrench,
  LogOut,
} from "lucide-react";

// ============================================================================
// NAVIGATION CONFIG
// ============================================================================

const navigationItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    href: "/customers",
  },
  {
    id: "items",
    label: "Items",
    icon: Package,
    href: "/items",
  },
  {
    id: "sale",
    label: "Sale",
    icon: ShoppingCart,
    children: [
      { id: "sale-invoices", label: "Sale Invoices", href: "/sale/invoices" },
      {
        id: "sale-estimates",
        label: "Estimates/Quotations",
        href: "/sale/estimates",
      },
      { id: "sale-payment-in", label: "Payment In", href: "/sale/payment-in" },
      {
        id: "sale-credit-notes",
        label: "Credit Notes",
        href: "/sale/credit-notes",
      },
    ],
  },
  {
    id: "purchase",
    label: "Purchase",
    icon: Receipt,
    children: [
      {
        id: "purchase-invoices",
        label: "Purchase Invoices",
        href: "/purchase/invoices",
      },
      {
        id: "purchase-payment-out",
        label: "Payment Out",
        href: "/purchase/payment-out",
      },
      {
        id: "purchase-expenses",
        label: "Expenses",
        href: "/purchase/expenses",
      },
    ],
  },
  {
    id: "cash-bank",
    label: "Cash & Bank",
    icon: Wallet,
    children: [
      {
        id: "bank-accounts",
        label: "Bank Accounts",
        href: "/cash-bank/accounts",
      },
      { id: "cash-in-hand", label: "Cash in Hand", href: "/cash-bank/cash" },
      { id: "cheques", label: "Cheques", href: "/cash-bank/cheques" },
      { id: "loans", label: "Loans", href: "/cash-bank/loans" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    href: "/reports",
  },
];

const bottomItems: NavItem[] = [
  {
    id: "utilities",
    label: "Utilities",
    icon: Wrench,
    href: "/utilities",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
  {
    id: "help",
    label: "Help & Support",
    icon: HelpCircle,
    href: "/help",
  },
];

// ============================================================================
// ROOT LAYOUT
// ============================================================================

export function RootLayout(): React.ReactNode {
  const navigate = useNavigate();
  const location = useLocation();

  // UI Store
  const {
    sidebarCollapsed,
    sidebarExpandedIds,
    toggleSidebar,
    toggleSidebarSection,
  } = useUIStore();

  // Auth Store
  const { user, signOut } = useAuthStore();

  // User display name
  const userDisplayName = useMemo((): string => {
    if (user?.user_metadata.full_name) {
      return user.user_metadata.full_name as string;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  }, [user]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    await signOut();
    void navigate({ to: "/login" });
  }, [signOut, navigate]);

  // Determine active item from current path
  const getActiveId = (): string => {
    const path = location.pathname;

    // Find matching nav item
    for (const item of [...navigationItems, ...bottomItems]) {
      if (item.href === path) return item.id;
      if (item.children) {
        for (const child of item.children) {
          if (child.href === path) return child.id;
        }
      }
    }

    // Default to dashboard
    if (path === "/") return "dashboard";
    return "";
  };

  const handleNavigate = useCallback(
    (item: NavItem) => {
      if (item.href) {
        void navigate({ to: item.href });
      }
    },
    [navigate]
  );

  return (
    <ToastProvider position="top-right">
      <AppShell
        sidebarCollapsed={sidebarCollapsed}
        sidebar={
          <Sidebar
            items={navigationItems}
            activeId={getActiveId()}
            expandedIds={sidebarExpandedIds}
            onToggleExpand={toggleSidebarSection}
            onNavigate={handleNavigate}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            header={
              <SidebarLogo
                logo={
                  <span className="text-primary-600 font-black text-xl">D</span>
                }
                name="DigiStoq"
                tagline="Inventory Management"
                isCollapsed={sidebarCollapsed}
                onClick={() => {
                  void navigate({ to: "/" });
                }}
              />
            }
            footer={
              <div className="space-y-4">
                {/* Bottom Navigation Items */}
                {!sidebarCollapsed && (
                  <div className="space-y-1 mb-4">
                    {bottomItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            handleNavigate(item);
                          }}
                          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[0.875rem] font-semibold text-slate-500 hover:bg-white/5 hover:text-white transition-all duration-200"
                        >
                          {Icon && <Icon className="h-4.5 w-4.5" />}
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                    {/* Logout Button */}
                    <button
                      type="button"
                      onClick={() => {
                        void handleLogout();
                      }}
                      className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[0.875rem] font-semibold text-slate-500 hover:bg-error/10 hover:text-error transition-all duration-200"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}

                {/* User Profile */}
                <SidebarUser
                  name={userDisplayName}
                  email={user?.email ?? ""}
                  isCollapsed={sidebarCollapsed}
                  onClick={() => {
                    void navigate({ to: "/settings/profile" });
                  }}
                />
              </div>
            }
          />
        }
      >
        <Outlet />
      </AppShell>
    </ToastProvider>
  );
}
