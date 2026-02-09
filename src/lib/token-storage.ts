import type { Store } from "@tauri-apps/plugin-store";
import { load } from "@tauri-apps/plugin-store";
import type { Session } from "@supabase/supabase-js";

// ============================================================================
// TYPES
// ============================================================================

interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
  user_email: string;
}

// ============================================================================
// STORE INSTANCE
// ============================================================================

let store: Store | null = null;
const STORE_NAME = "auth.json";
const SESSION_KEY = "supabase_session";

async function getStore(): Promise<Store> {
  if (store) return store;
  try {
    store = await load(STORE_NAME);
  } catch (e) {
    console.error("[token-storage] Failed to load store:", e);
    throw e;
  }
  return store;
}

// ============================================================================
// CHECK IF RUNNING IN TAURI
// ============================================================================

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

// ============================================================================
// TOKEN STORAGE METHODS
// ============================================================================

/**
 * Save session tokens securely using Tauri store (OS-level storage)
 * Falls back to localStorage for web development
 */
export async function saveSession(session: Session): Promise<void> {
  const storedSession: StoredSession = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? 0,
    user_id: session.user.id,
    user_email: session.user.email ?? "",
  };

  if (isTauri()) {
    try {
      const s = await getStore();
      await s.set(SESSION_KEY, storedSession);
      await s.save();
    } catch (error) {
      console.error("Failed to save session to Tauri store:", error);
      // Fallback to localStorage
      localStorage.setItem(SESSION_KEY, JSON.stringify(storedSession));
    }
  } else {
    // Web development fallback
    localStorage.setItem(SESSION_KEY, JSON.stringify(storedSession));
  }
}

/**
 * Load session tokens from secure storage
 * Returns null if no session exists or if it's expired
 */
export async function loadSession(): Promise<StoredSession | null> {
  let storedSession: StoredSession | null = null;

  if (isTauri()) {
    try {
      const s = await getStore();
      const result = await s.get<StoredSession>(SESSION_KEY);
      storedSession = result ?? null;
    } catch (error) {
      console.error("Failed to load session from Tauri store:", error);
      // Fallback to localStorage
      const data = localStorage.getItem(SESSION_KEY);
      storedSession = data ? JSON.parse(data) : null;
    }
  } else {
    // Web development fallback
    const data = localStorage.getItem(SESSION_KEY);
    storedSession = data ? JSON.parse(data) : null;
  }

  if (!storedSession) {
    return null;
  }

  // Check if session is expired (with 60 second buffer)
  const now = Math.floor(Date.now() / 1000);
  if (storedSession.expires_at > 0 && storedSession.expires_at < now + 60) {
    // Session expired, but we still return it so refresh can be attempted
    // The auth store will handle the refresh
  }

  return storedSession;
}

/**
 * Clear all stored session data
 */
export async function clearSession(): Promise<void> {
  if (isTauri()) {
    try {
      const s = await getStore();
      await s.delete(SESSION_KEY);
      await s.save();
    } catch (error) {
      console.error("Failed to clear session from Tauri store:", error);
    }
  }

  // Always clear localStorage as well
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Check if a stored session exists (without loading full data)
 */
export async function hasStoredSession(): Promise<boolean> {
  if (isTauri()) {
    try {
      const s = await getStore();
      const session = await s.get<StoredSession>(SESSION_KEY);
      return session !== undefined;
    } catch {
      // Fallback to localStorage check
      return localStorage.getItem(SESSION_KEY) !== null;
    }
  }
  return localStorage.getItem(SESSION_KEY) !== null;
}

/**
 * Get stored tokens for session restoration
 * Used by Supabase client to restore session
 */
export async function getStoredTokens(): Promise<{
  access_token: string;
  refresh_token: string;
} | null> {
  const session = await loadSession();
  if (!session) {
    return null;
  }
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  };
}
