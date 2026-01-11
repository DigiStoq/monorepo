import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
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
// AUTH POPUP SCREEN
// ============================================================================

function AuthPopupScreen(): ReactNode {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center p-8">
        <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          Completing Sign In...
        </h2>
        <p className="text-slate-500 text-sm mt-2">
          This window should close automatically.
        </p>
        <div className="mt-8 animate-pulse text-xs text-slate-400">
          Waiting for authentication...
        </div>

        {/* Manual Close Button Fallback */}
        <button
          onClick={() => {
            window.close();
          }}
          className="mt-8 text-xs text-slate-400 hover:text-slate-600 underline"
        >
          Close this window
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
  const [status, setStatus] = useState<AppStatus | "auth-popup">("loading");
  const [error, setError] = useState<string | null>(null);

  // Auth state
  const { initialize: initializeAuth, isInitialized: authInitialized } =
    useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function init(): Promise<void> {
      try {
        // ------------------------------------------------------------------
        // HANDLE EXPLICIT AUTH POPUP (Before Init)
        // ------------------------------------------------------------------

        // TAURI: Check window label and emit event
        // We use a query param 'auth_popup=true' in the redirect URL to reliably detect if we are in the auth popup.
        const urlParams = new URLSearchParams(window.location.search);
        const isAuthPopupParam = urlParams.get("auth_popup") === "true";

        // Also check legacy/fallback methods
        const isTauriPopup =
          isAuthPopupParam ||
          (typeof window !== "undefined" && "__TAURI__" in window);

        if (isTauriPopup) {
          // If confirmed via URL param, we can be sure.
          if (isAuthPopupParam) {
            if (mounted) setStatus("auth-popup");
          }

          try {
            const { getCurrentWindow } = await import("@tauri-apps/api/window");
            const { emit } = await import("@tauri-apps/api/event");
            const { supabase } = await import("@/lib/supabase-client");

            const win = getCurrentWindow();

            // If URL param missing, fallback to label check
            if (!isAuthPopupParam && win.label === "google-auth") {
              if (mounted) setStatus("auth-popup");
            }

            const isConfirmedPopup =
              isAuthPopupParam || win.label === "google-auth";

            if (isConfirmedPopup) {
              const handleSuccess = async (session: Session): Promise<void> => {
                // Emit without awaiting to prevent blocking (fire and forget)
                // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
                emit("auth-success", { session }).catch((err) => {
                  console.error("Emit failed", err);
                });

                // Try multiple closure methods
                setTimeout(() => {
                  void (async () => {
                    try {
                      await win.close();
                    } catch (e) {
                      console.error("win.close failed", e);
                      window.close(); // Fallback to native close
                    }
                  })();
                }, 500); // Small delay to allow emit to send
              };

              // Check existing session
              const {
                data: { session: existingSession },
              } = await supabase.auth.getSession();
              if (existingSession) {
                await handleSuccess(existingSession);
                return;
              }

              // Wait for auth state change
              const {
                data: { subscription: _subscription },
              } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === "SIGNED_IN" && session) {
                  await handleSuccess(session);
                }
              });

              return; // Stop normal app init
            }
          } catch (e) {
            console.error("Tauri detection/API failed", e);
            // If we know it's the popup via URL param, stay in popup mode
            if (isAuthPopupParam) {
              return;
            }
          }
        }

        // WEB: Standard window.opener check
        if (window.opener && window.name === "google-auth") {
          window.close();
          return;
        }

        // ------------------------------------------------------------------
        // NORMAL APP INITIALIZATION
        // ------------------------------------------------------------------

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

    // Handle page refresh/close - force PowerSync cleanup
    const handleBeforeUnload = (): void => {
      void disconnectPowerSync();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      mounted = false;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      void disconnectPowerSync();
    };
  }, [initializeAuth]);

  // Loading state
  if (status === "loading" || (!authInitialized && status !== "auth-popup")) {
    return <LoadingScreen />;
  }

  // Auth Popup state
  if (status === "auth-popup") {
    return <AuthPopupScreen />;
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
