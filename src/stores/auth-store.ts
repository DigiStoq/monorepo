import { create } from "zustand";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import {
  saveSession,
  clearSession,
  getStoredTokens,
  loadSession,
} from "@/lib/token-storage";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

export interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;

  // Computed
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// HELPER: Build offline session from cached tokens
// ============================================================================

/**
 * Build a minimal Session object from cached credentials for offline use.
 * This allows users to stay logged in when the app starts without internet.
 */
async function buildOfflineSession(tokens: {
  access_token: string;
  refresh_token: string;
}): Promise<Session | null> {
  // Load full stored session which includes user info
  const storedSession = await loadSession();

  if (!storedSession) {
    return null;
  }

  // Construct a minimal User object from stored data
  const offlineUser: User = {
    id: storedSession.user_id,
    email: storedSession.user_email,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "",
  };

  // Construct a minimal Session object
  const offlineSession: Session = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: 3600,
    expires_at: storedSession.expires_at,
    token_type: "bearer",
    user: offlineUser,
  };

  return offlineSession;
}

// ============================================================================
// STORE
// ============================================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,
  error: null,
  isAuthenticated: false,

  // Initialize auth - called on app start
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Try to restore session from secure storage
      const storedTokens = await getStoredTokens();

      if (storedTokens) {
        // Check if we're online
        const isOnline = navigator.onLine;

        if (isOnline) {
          // Online: Attempt to validate/restore session with Supabase
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: storedTokens.access_token,
              refresh_token: storedTokens.refresh_token,
            });

            if (error) {
              // Session invalid, clear stored tokens
              console.error("Auth store rehydrated with invalid session");
              await clearSession();
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true,
              });
              return;
            }

            if (data.session) {
              // Save the refreshed session
              await saveSession(data.session);
              set({
                user: data.session.user,
                session: data.session,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
              });
              return;
            }
          } catch (networkError) {
            // Network error during validation - fall through to offline mode
            console.warn(
              "Network error during session validation, using cached session:",
              networkError
            );
          }
        }

        // Offline or network error: Use cached session without validation
        // Build a minimal session/user from stored tokens for offline use
        const offlineSession = await buildOfflineSession(storedTokens);
        if (offlineSession) {
          set({
            user: offlineSession.user,
            session: offlineSession,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
          return;
        }
      }

      // No stored session, check Supabase for existing session (online only)
      if (navigator.onLine) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            await saveSession(session);
            set({
              user: session.user,
              session: session,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
            });
            return;
          }
        } catch (error) {
          console.warn("Could not get session from Supabase:", error);
        }
      }

      // No session available
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    } catch (err) {
      console.error("Auth initialization error:", err);
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: err as AuthError,
      });
    }
  },

  // Sign in with email/password
  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ isLoading: false, error });
      return { error };
    }

    await saveSession(data.session);
    set({
      user: data.user,
      session: data.session,
      isAuthenticated: true,
      isLoading: false,
    });

    return { error: null };
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });

    // Open popup immediately to prevent blockage (must be synchronous to user click)
    // HANDLE TAURI ENV
    // HANDLE TAURI ENV
    // Check for Tauri v1 or v2 internals
    const isTauri =
      typeof window !== "undefined" &&
      ("__TAURI__" in window || "__TAURI_INTERNALS__" in window);

    if (isTauri) {
      try {
        // Dynamic imports for Tauri APIs
        const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        const { listen } = await import("@tauri-apps/api/event");
        // open is unused
        // const { open } = await import('@tauri-apps/plugin-shell');

        // 1. Get Auth URL from Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin + "?auth_popup=true",
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          console.error("Supabase OAuth Init Error:", error);
          set({ isLoading: false, error });
          return { error };
        }

        if (data.url) {
          // eslint-disable-next-line no-console
          console.log("Opening auth window for URL:", data.url);

          try {
            // 2. Try creating a Webview Window (Best DX)
            const authWindow = new WebviewWindow("google-auth", {
              url: data.url,
              title: "Sign in with Google",
              width: 500,
              height: 600,
              center: true,
              focus: true,
              skipTaskbar: false,
            });

            // Check if creation failed immediately (promise rejection usually)
            void authWindow.once("tauri://error", (e) => {
              console.error("Window creation error event:", JSON.stringify(e));
              // Fallback handled below if listen fails
            });

            // 3. Listen for success event from the popup window
            const unlisten = await listen("auth-success", (event: unknown) => {
              void (async () => {
                const payload = (event as { payload: { session: Session } })
                  .payload;
                // eslint-disable-next-line no-console
                console.log("Auth success event received", event);
                unlisten(); // Stop listening

                // Close the window from the main process!
                // eslint-disable-next-line no-console
                console.log("Closing auth window from main process...");
                try {
                  await authWindow.close();
                } catch (e) {
                  console.error(
                    "Failed to close auth window from main process",
                    e
                  );
                }

                const session = payload.session;
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (session) {
                  const { error } = await supabase.auth.setSession(session);
                  if (!error) {
                    await saveSession(session);
                    set({
                      user: session.user,
                      session: session,
                      isAuthenticated: true,
                      isLoading: false,
                    });
                  }
                } else {
                  console.error("Auth success event missing session");
                  set({
                    isLoading: false,
                    error: new Error(
                      "Authentication failed: No session received"
                    ) as AuthError,
                  });
                }
              })();
            });
          } catch (windowError: unknown) {
            console.error("WebviewWindow creation failed:", windowError);
            toast.error(
              "Could not open sign-in window. Trying system browser..."
            );

            // Fallback: Open in Default System Browser
            // Note: This requires the redirect URL to be a deep link (e.g. com.digistoq.desktop://login) which we haven't set up yet.
            // So using system browser with localhost redirect WON'T work for Desktop app login.
            // We must fail gracefully.
            const errorMsg =
              windowError instanceof Error
                ? windowError.message
                : String(windowError);
            set({
              isLoading: false,
              error: {
                message: "Failed to open sign-in window: " + errorMsg,
              } as AuthError,
            });
            return {
              error: {
                message: "Could not open sign-in window. Please restart app.",
              } as AuthError,
            };
          }
        }
        return { error: null };
      } catch (err: unknown) {
        console.error("Tauri Auth Critical Failure:", err);
        const msg = err instanceof Error ? err.message : String(err);
        set({
          isLoading: false,
          error: { message: "Tauri auth error: " + msg } as AuthError,
        });
        return { error: { message: "Tauri auth error" } as AuthError };
      }
    }

    // HANDLE WEB ENV (Standard Popup)
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      "about:blank",
      "google-auth",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );

    if (!popup) {
      set({
        isLoading: false,
        error: {
          message: "Popup blocked. Please allow popups for this site.",
        } as AuthError,
      });
      return {
        error: {
          message: "Popup blocked. Please allow popups for this site.",
        } as AuthError,
      };
    }

    // Show loading state in popup
    popup.document.write(`
      <html>
        <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f8fafc;">
          <div style="text-align:center;color:#475569;">
            <p>Connecting to Google...</p>
          </div>
        </body>
      </html>
    `);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      popup.close();
      set({ isLoading: false, error });
      return { error };
    }

    if (data.url) {
      // Redirect the already-open popup
      popup.location.href = data.url;

      // We rely on the popup closing itself or storage events to update state
      const checkSession = setInterval(() => {
        void (async () => {
          if (popup.closed) {
            clearInterval(checkSession);
            // Re-check session on close
            try {
              const {
                data: { session },
              } = await supabase.auth.getSession();
              if (session) {
                await saveSession(session);
                set({
                  user: session.user,
                  session: session,
                  isAuthenticated: true,
                  isLoading: false,
                });
              } else {
                set({ isLoading: false });
              }
            } catch {
              set({ isLoading: false });
            }
          }
        })();
      }, 1000);
    } else {
      popup.close();
    }

    return { error: null };
  },

  // Sign up with email/password
  signUp: async (email: string, password: string, name?: string) => {
    set({ isLoading: true, error: null });

    const signUpOptions = name ? { data: { full_name: name } } : {};
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: signUpOptions,
    });

    if (error) {
      set({ isLoading: false, error });
      return { error };
    }

    // If email confirmation is required, session might be null
    if (data.session) {
      await saveSession(data.session);
      set({
        user: data.user,
        session: data.session,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      // Email confirmation required
      set({
        user: data.user,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }

    return { error: null };
  },

  // Sign out
  signOut: async () => {
    set({ isLoading: true });

    await supabase.auth.signOut();
    await clearSession();

    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  // Request password reset
  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    set({ isLoading: false, error });
    return { error };
  },

  // Update password (when logged in)
  updatePassword: async (newPassword: string) => {
    set({ isLoading: true, error: null });

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    set({ isLoading: false, error });
    return { error };
  },

  // Refresh the current session
  refreshSession: async () => {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error("Session refresh failed:", error);
      // Session expired, sign out
      toast.error("Session expired. Please sign in again.");
      await get().signOut();
      return;
    }

    if (data.session) {
      await saveSession(data.session);
      set({
        user: data.session.user,
        session: data.session,
        isAuthenticated: true,
      });
    }
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },
}));

// ============================================================================
// AUTH STATE LISTENER
// ============================================================================

// Set up listener for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  const { isInitialized } = useAuthStore.getState();

  // Only react to changes after initialization
  if (!isInitialized) return;

  switch (event) {
    case "SIGNED_IN":
      if (session) {
        await saveSession(session);
        useAuthStore.setState({
          user: session.user,
          session: session,
          isAuthenticated: true,
        });
      }
      break;

    case "SIGNED_OUT":
      await clearSession();
      useAuthStore.setState({
        user: null,
        session: null,
        isAuthenticated: false,
      });
      break;

    case "TOKEN_REFRESHED":
      if (session) {
        await saveSession(session);
        useAuthStore.setState({
          user: session.user,
          session: session,
        });
      }
      break;

    case "USER_UPDATED":
      if (session) {
        useAuthStore.setState({
          user: session.user,
        });
      }
      break;
  }
});
