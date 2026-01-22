import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// ============================================================================
// TYPES
// ============================================================================

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps): ReactNode {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/20">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            {title}
          </h1>
          {subtitle && <p className="text-slate-500 mt-2">{subtitle}</p>}
        </div>

        {/* Card */}
        <div
          className={cn(
            "bg-white rounded-2xl shadow-xl shadow-slate-200/50",
            "border border-slate-200/50",
            "p-8"
          )}
        >
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400 mt-6">
          DigiStoq - Inventory Management
        </p>
      </div>
    </div>
  );
}
