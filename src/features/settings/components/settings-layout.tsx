import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import { SettingsNav } from "./settings-nav";

interface SettingsLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  showBackButton?: boolean;
}

export function SettingsLayout({
  title,
  description,
  children,
  actions,
  showBackButton = true,
}: SettingsLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          {showBackButton && (
            <Link to="/settings" className="inline-block mb-4">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Settings
              </Button>
            </Link>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              {description && (
                <p className="mt-1 text-slate-500">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
        </div>

        {/* Content */}
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <SettingsNav />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
