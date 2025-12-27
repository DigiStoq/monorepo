# Supabase Authentication System for DigiStoq (Tauri Desktop)

## Overview
Implement Supabase Email/Password authentication with secure token storage for the Tauri desktop app. Tokens stored securely on OS (not cookies). No user roles - all authenticated users have full access.

## Scope
- **Auth Method**: Email/Password only
- **Roles**: None (all users equal)
- **Token Storage**: Tauri Store plugin (OS secure storage)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              AuthProvider (context)                  │    │
│  │  - user state, session state, loading state          │    │
│  │  - login/logout/signup methods                       │    │
│  │  - auto-refresh tokens                               │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │         Router (TanStack)                    │    │    │
│  │  │  /login, /signup → Auth Pages (public)       │    │    │
│  │  │  /* → Protected Routes (require auth)        │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Files to Create/Modify

### Phase 1: Secure Token Storage (Tauri)

1. **Add Tauri Store Plugin**
   - `src-tauri/Cargo.toml` - Add `tauri-plugin-store`
   - `src-tauri/src/lib.rs` - Register plugin

2. **Create Token Storage Helper**
   - `src/lib/token-storage.ts`
   ```typescript
   // Use Tauri store plugin for secure token persistence
   // Store: access_token, refresh_token, expires_at
   // Methods: saveSession, loadSession, clearSession
   ```

### Phase 2: Auth Store & Context

3. **Create Auth Store**
   - `src/stores/auth-store.ts`
   ```typescript
   // Zustand store for auth state
   interface AuthState {
     user: User | null;
     session: Session | null;
     isLoading: boolean;
     isAuthenticated: boolean;
     initialize: () => Promise<void>;
     signIn: (email, password) => Promise<void>;
     signUp: (email, password, name) => Promise<void>;
     signOut: () => Promise<void>;
     refreshSession: () => Promise<void>;
   }
   ```

4. **Create Auth Provider**
   - `src/providers/auth-provider.tsx`
   - Wraps app with auth context
   - Handles session initialization on app start
   - Listens to Supabase auth state changes

### Phase 3: Auth UI Components

5. **Auth Layout**
   - `src/components/auth/auth-layout.tsx` - Centered card layout for auth pages

6. **Login Page**
   - `src/features/auth/login-page.tsx`
   - Email/password form
   - "Remember me" (persist session)
   - Link to signup/forgot password

7. **Signup Page**
   - `src/features/auth/signup-page.tsx`
   - Email, password, name fields
   - Password confirmation
   - Link to login

8. **Forgot Password Page**
   - `src/features/auth/forgot-password-page.tsx`
   - Email input
   - Send reset link

### Phase 4: Route Protection

9. **Update Router**
   - `src/routes/router.tsx`
   - Add auth routes (/login, /signup, /forgot-password)
   - Create `ProtectedRoute` wrapper
   - Redirect unauthenticated users to /login
   - Redirect authenticated users away from /login

10. **Auth Route Guard**
    - `src/routes/guards.tsx`
    ```typescript
    // beforeLoad hook for protected routes
    // Check auth state, redirect if needed
    ```

### Phase 5: Integration

11. **Update App.tsx**
    - `src/app/App.tsx`
    - Wrap with AuthProvider
    - Initialize auth before PowerSync
    - Only connect PowerSync when authenticated

12. **Update Supabase Connector**
    - `src/lib/supabase-connector.ts`
    - Use stored tokens for session
    - Handle token refresh
    - Proper error handling for expired sessions

13. **Update Sidebar User**
    - `src/routes/__root.tsx`
    - Show actual user name/email from auth store
    - Add logout button

14. **Update Settings Page**
    - `src/features/settings/profile-page.tsx`
    - Show/edit actual user profile
    - Change password option

## Implementation Order

### Step 1: Tauri Store Plugin
```toml
# src-tauri/Cargo.toml
tauri-plugin-store = "2"
```

```rust
// src-tauri/src/lib.rs
.plugin(tauri_plugin_store::Builder::new().build())
```

### Step 2: Token Storage (`src/lib/token-storage.ts`)
- Save/load tokens using Tauri store
- Fallback to localStorage for web dev

### Step 3: Auth Store (`src/stores/auth-store.ts`)
- Zustand store with auth methods
- Integrates with token storage

### Step 4: Auth Pages
- Login, Signup, Forgot Password
- Using existing UI components

### Step 5: Route Updates
- Add auth routes
- Protect existing routes
- Redirect logic

### Step 6: App Integration
- AuthProvider wrapper
- PowerSync after auth
- Sidebar user update

## Key Files to Modify

| File | Changes |
|------|---------|
| `src-tauri/Cargo.toml` | Add tauri-plugin-store |
| `src-tauri/src/lib.rs` | Register store plugin |
| `src/lib/supabase-connector.ts` | Token-based session |
| `src/app/App.tsx` | AuthProvider, auth flow |
| `src/routes/router.tsx` | Auth routes, protection |
| `src/routes/__root.tsx` | Dynamic user in sidebar |

## New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/token-storage.ts` | Secure token persistence |
| `src/stores/auth-store.ts` | Auth state management |
| `src/providers/auth-provider.tsx` | Auth context provider |
| `src/features/auth/login-page.tsx` | Login UI |
| `src/features/auth/signup-page.tsx` | Signup UI |
| `src/features/auth/forgot-password-page.tsx` | Password reset |
| `src/components/auth/auth-layout.tsx` | Auth page layout |
| `src/features/auth/index.ts` | Barrel export |
| `src/features/auth/types.ts` | Auth types |

## Supabase Setup Required

1. Enable Email/Password authentication in Supabase Dashboard
2. Configure email templates (optional)
3. Set up redirect URLs for password reset

## Security Considerations

- Tokens stored via Tauri Store (OS keychain on macOS, credential manager on Windows)
- Access tokens short-lived, refresh tokens for renewal
- Clear tokens on logout
- Session validation on app start
