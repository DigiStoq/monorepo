/// <reference types="vitest/globals" />
import { vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

expect.extend(matchers);

// Mock Tauri APIs
vi.mock("@tauri-apps/api", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-store", () => ({
  Store: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  save: vi.fn(),
  message: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
  Command: vi.fn(),
}));

// Mock PowerSync
vi.mock("@powersync/react", () => ({
  usePowerSync: vi.fn(() => ({
    execute: vi.fn(),
    getAll: vi.fn(() => []),
  })),
  useQuery: vi.fn(() => ({ data: [], isLoading: false })),
  useStatus: vi.fn(() => ({ connected: true })),
  PowerSyncContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

vi.mock("@powersync/web", () => ({
  PowerSyncDatabase: vi.fn(),
  Schema: vi.fn(),
  Table: vi.fn(),
  column: {
    text: vi.fn(),
    integer: vi.fn(),
    real: vi.fn(),
  },
}));

// Mock Supabase
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
}));
