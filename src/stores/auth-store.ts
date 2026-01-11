import { create } from "zustand";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-connector";
import {
  saveSession,
  clearSession,
  getStoredTokens,
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
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
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
        // Attempt to restore session with stored tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: storedTokens.access_token,
          refresh_token: storedTokens.refresh_token,
        });

        if (error) {
          // Session invalid, clear stored tokens
          console.warn("Stored session invalid, clearing:", error.message);
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
      }

      // No stored session, check Supabase for existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        await saveSession(session);
        set({
          user: session.user,
          session: session,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
      }
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

    if (data.session) {
      await saveSession(data.session);
      set({
        user: data.user,
        session: data.session,
        isAuthenticated: true,
        isLoading: false,
      });
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
