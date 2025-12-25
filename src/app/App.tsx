import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { PowerSyncContext } from "@powersync/web/react";
import type { PowerSyncDatabase } from "@powersync/web";
import { initializePowerSync, disconnectPowerSync } from "@/lib/powersync";
import { ProductList } from "@/features/inventory";

type AppStatus = "loading" | "ready" | "error";

export function App(): ReactNode {
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);
  const [status, setStatus] = useState<AppStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init(): Promise<void> {
      try {
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
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing DigiStoq...</p>
        </div>
      </div>
    );
  }

  if (status === "error" || !db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Initialization Error
          </h1>
          <p className="text-gray-600 text-sm">{error ?? "Unknown error"}</p>
        </div>
      </div>
    );
  }

  return (
    <PowerSyncContext.Provider value={db}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-xl font-bold text-gray-900">DigiStoq</h1>
            <p className="text-sm text-gray-500">Inventory Management</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <ProductList />
          </div>
        </main>
      </div>
    </PowerSyncContext.Provider>
  );
}
