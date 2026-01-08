/**
 * DigiStoq Design System Theme
 * Centralized design tokens for consistent styling
 */

export const colors = {
  // Primary
  primary: "#6366f1",
  primaryLight: "#818cf8",
  primaryDark: "#4f46e5",
  primaryMuted: "#e0e7ff",
  
  // Secondary
  secondary: "#f59e0b",
  secondaryLight: "#fbbf24",
  secondaryMuted: "#fef3c7",
  
  // Success
  success: "#22c55e",
  successLight: "#4ade80",
  successMuted: "#dcfce7",
  
  // Danger
  danger: "#ef4444",
  dangerLight: "#f87171",
  dangerMuted: "#fee2e2",
  
  // Neutral
  text: "#0f172a",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  
  // Backgrounds
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceHover: "#f1f5f9",
  
  // Borders
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  
  // Sidebar
  sidebar: "#1e1b4b",
  sidebarText: "#c7d2fe",
  sidebarActive: "#6366f1",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
};

export default theme;
