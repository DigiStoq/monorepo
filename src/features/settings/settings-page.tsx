import { Link } from "@tanstack/react-router";
import { Card, CardBody } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  Building2,
  User,
  Settings,
  Receipt,
  Shield,
  Database,
  ChevronRight,
} from "lucide-react";

const settingsSections = [
  {
    id: "company",
    label: "Company Settings",
    description:
      "Manage your business profile, address, and registration details",
    icon: Building2,
    path: "/settings/company",
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "profile",
    label: "User Profile",
    description: "Update your account information and notification preferences",
    icon: User,
    path: "/settings/profile",
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Customize app appearance, date formats, and display settings",
    icon: Settings,
    path: "/settings/preferences",
    color: "bg-slate-100 text-slate-600",
  },
  {
    id: "tax",
    label: "Tax & Invoice",
    description: "Configure tax rates, invoice numbering, and payment terms",
    icon: Receipt,
    path: "/settings/tax",
    color: "bg-amber-100 text-amber-600",
  },
  {
    id: "security",
    label: "Security",
    description: "Manage passwords, sessions, and security settings",
    icon: Shield,
    path: "/settings/security",
    color: "bg-rose-100 text-rose-600",
  },
  {
    id: "backup",
    label: "Backup & Data",
    description: "Export data, manage backups, and restore from previous saves",
    icon: Database,
    path: "/settings/backup",
    color: "bg-teal-100 text-teal-600",
  },
];

export function SettingsPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="mt-1 text-slate-500">
            Manage your account and application preferences
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {settingsSections.map((section) => {
            const Icon = section.icon;

            return (
              <Link key={section.id} to={section.path}>
                <Card className="h-full hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group">
                  <CardBody className="p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "p-3 rounded-xl flex-shrink-0",
                          section.color
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                            {section.label}
                          </h3>
                          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* App Info */}
        <div className="mt-8 text-center text-sm text-slate-400">
          <p>DigiStoq v1.0.0</p>
          <p className="mt-1">
            <a href="#" className="hover:text-teal-600 transition-colors">
              Terms of Service
            </a>
            {" · "}
            <a href="#" className="hover:text-teal-600 transition-colors">
              Privacy Policy
            </a>
            {" · "}
            <a href="#" className="hover:text-teal-600 transition-colors">
              Help Center
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
