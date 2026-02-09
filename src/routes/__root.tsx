import { useCallback, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import {
  AppShell,
  Sidebar,
  SidebarLogo,
  SidebarUser,
  type NavItem,
} from "@/components/layout";
import { toast } from "sonner";
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
    toast.success("Signed out successfully");
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
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                >
                  <path
                    d="M20.5 8V16.2C20.5 17.8802 20.5 18.7202 20.173 19.362C19.8854 19.9265 19.4265 20.3854 18.862 20.673C18.2202 21 17.3802 21 15.7 21H8.3C6.61984 21 5.77976 21 5.13803 20.673C4.57354 20.3854 4.1146 19.9265 3.82698 19.362C3.5 18.7202 3.5 17.8802 3.5 16.2V8M3.6 3H20.4C20.9601 3 21.2401 3 21.454 3.10899C21.6422 3.20487 21.7951 3.35785 21.891 3.54601C22 3.75992 22 4.03995 22 4.6V6.4C22 6.96005 22 7.24008 21.891 7.45399C21.7951 7.64215 21.6422 7.79513 21.454 7.89101C21.2401 8 20.9601 8 20.4 8H3.6C3.03995 8 2.75992 8 2.54601 7.89101C2.35785 7.79513 2.20487 7.64215 2.10899 7.45399C2 7.24008 2 6.96005 2 6.4V4.6C2 4.03995 2 3.75992 2.10899 3.54601C2.20487 3.35785 2.35785 3.20487 2.54601 3.10899C2.75992 3 3.03995 3 3.6 3ZM9.6 11.5H14.4C14.9601 11.5 15.2401 11.5 15.454 11.609C15.6422 11.7049 15.7951 11.8578 15.891 12.046C16 12.2599 16 12.5399 16 13.1V13.9C16 14.4601 16 14.7401 15.891 14.954C15.7951 15.1422 15.6422 15.2951 15.454 15.391C15.2401 15.5 14.9601 15.5 14.4 15.5H9.6C9.03995 15.5 8.75992 15.5 8.54601 15.391C8.35785 15.2951 8.20487 15.1422 8.10899 14.954C8 14.7401 8 14.4601 8 13.9V13.1C8 12.5399 8 12.2599 8.10899 12.046C8.20487 11.8578 8.35785 11.7049 8.54601 11.609C8.75992 11.5 9.03995 11.5 9.6 11.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
  );
}
