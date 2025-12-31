import { create } from "zustand";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import {
  saveSession,
  clearSession,
  getStoredTokens,
  loadSession,
} from "@/lib/token-storage";

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
