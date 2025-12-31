import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { PowerSyncContext } from "@powersync/react";
import type { PowerSyncDatabase } from "@powersync/web";
import { initializePowerSync, disconnectPowerSync } from "@/lib/powersync";
import { useAuthStore } from "@/stores";
import { router } from "@/routes";
import { Spinner } from "@/components/common";

// ============================================================================
// TYPES
// ============================================================================

type AppStatus = "loading" | "ready" | "error";

// ============================================================================
// LOADING SCREEN
// ============================================================================

function LoadingScreen(): ReactNode {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">D</span>
        </div>
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Initializing DigiStoq...</p>
        <p className="text-slate-400 text-sm mt-1">Setting up your workspace</p>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR SCREEN
// ============================================================================

function ErrorScreen({ error }: { error: string | null }): ReactNode {
  const handleRetry = (): void => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md p-6">
        <div className="h-16 w-16 bg-error-light rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-error text-2xl font-bold">!</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2 font-display">
          Initialization Error
        </h1>
        <p className="text-slate-600 text-sm mb-6">
          {error ?? "An unknown error occurred while starting the application."}
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

export function App(): React.ReactNode {
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);
  const [status, setStatus] = useState<AppStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  // Auth state
  const { initialize: initializeAuth, isInitialized: authInitialized } =
    useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function init(): Promise<void> {
      try {
        // Step 1: Initialize auth (restore session from secure storage)
        await initializeAuth();

        // Step 2: Initialize PowerSync (works offline, syncs when authenticated)
        const database = await initializePowerSync();

        if (mounted) {
          setDb(database);
          setStatus("ready");
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize");
          setStatus("error");
        }
      }
    }

    void init();

    return () => {
      mounted = false;
      void disconnectPowerSync();
    };
  }, [initializeAuth]);

  // Loading state
  if (status === "loading" || !authInitialized) {
    return <LoadingScreen />;
  }

  // Error state
  if (status === "error" || !db) {
    return <ErrorScreen error={error} />;
  }

  // Ready - render app with router
  return (
    <PowerSyncContext.Provider value={db}>
      <RouterProvider router={router} />
    </PowerSyncContext.Provider>
  );
}
