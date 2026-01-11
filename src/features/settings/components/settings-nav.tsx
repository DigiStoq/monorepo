import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import {
  Building2,
  User,
  Settings,
  Receipt,
  Shield,
  Database,
} from "lucide-react";

const settingsSections = [
  {
    id: "company",
    label: "Company",
    description: "Business profile and details",
    icon: Building2,
    path: "/settings/company",
  },
  {
    id: "profile",
    label: "User Profile",
    description: "Your account settings",
    icon: User,
    path: "/settings/profile",
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "App appearance and behavior",
    icon: Settings,
    path: "/settings/preferences",
  },
  {
    id: "tax",
    label: "Tax & Invoice",
    description: "Tax rates and invoice settings",
    icon: Receipt,
    path: "/settings/tax",
  },
  {
    id: "security",
    label: "Security",
    description: "Account security options",
    icon: Shield,
    path: "/settings/security",
  },
  {
    id: "backup",
    label: "Backup & Data",
    description: "Data management and backups",
    icon: Database,
    path: "/settings/backup",
  },
];

export function SettingsNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="space-y-1">
      {settingsSections.map((section) => {
        const Icon = section.icon;
        const isActive = currentPath === section.path;

        return (
          <Link
            key={section.id}
            to={section.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              isActive
                ? "bg-teal-50 text-teal-700 border border-teal-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-teal-600" : "text-slate-400"
              )}
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-teal-700" : "text-slate-700"
                )}
              >
                {section.label}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {section.description}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

export { settingsSections };
