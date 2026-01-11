/**
 * DigiStoq Light Theme Design System
 * Clean white theme with warm accents
 */

// Light Theme Colors
export const lightColors = {
  // Backgrounds
  background: "#f8fafc",     // Page background (slate-50)
  backgroundLight: "#ffffff", // Header/Nav background
  backgroundCard: "#ffffff",  // Card background
  
  // Accents
  accent: "#C4A484",
  accentLight: "#d4b494",
  accentDark: "#a48a6a",
  
  // Surfaces
  surface: "#ffffff",
  surfaceHover: "#f1f5f9",
  surfaceActive: "#e2e8f0",
  
  // Text
  text: "#0f172a",          // slate-900
  textSecondary: "#475569", // slate-600
  textMuted: "#94a3b8",     // slate-400
  textOnAccent: "#ffffff",
  
  // Status
  success: "#22c55e",
  successMuted: "#dcfce7",
  warning: "#f59e0b",
  warningMuted: "#fef3c7",
  danger: "#ef4444",
  dangerMuted: "#fee2e2",
  info: "#3b82f6",
  infoMuted: "#dbeafe",
  
  // Borders
  border: "#e2e8f0",      // slate-200
  borderLight: "#f1f5f9", // slate-50
  
  // Legacy
  primary: "#C4A484",
  primaryLight: "#d4b494",
  primaryMuted: "#f5f0eb",
  secondary: "#6366f1",
} as const;

// Dark Theme Colors
export const darkColors = {
  // Backgrounds
  background: "#0f172a",     // slate-900
  backgroundLight: "#020617", // slate-950 (headers)
  backgroundCard: "#1e293b",  // slate-800
  
  // Accents
  accent: "#C4A484",
  accentLight: "#d4b494",
  accentDark: "#a48a6a",
  
  // Surfaces
  surface: "#1e293b",      // slate-800
  surfaceHover: "#334155", // slate-700
  surfaceActive: "#475569", // slate-600
  
  // Text
  text: "#f8fafc",          // slate-50
  textSecondary: "#cbd5e1", // slate-300
  textMuted: "#94a3b8",     // slate-400
  textOnAccent: "#ffffff",
  
  // Status (Adjusted for dark mode contrast if needed, keeping mostly same for now but could use slightly lighter/desaturated)
  success: "#22c55e",
  successMuted: "rgba(34, 197, 94, 0.2)",
  warning: "#f59e0b",
  warningMuted: "rgba(245, 158, 11, 0.2)",
  danger: "#ef4444",
  dangerMuted: "rgba(239, 68, 68, 0.2)",
  info: "#3b82f6",
  infoMuted: "rgba(59, 130, 246, 0.2)",
  
  // Borders
  border: "#334155",      // slate-700
  borderLight: "#1e293b", // slate-800
  
  // Legacy
  primary: "#C4A484",
  primaryLight: "#d4b494",
  primaryMuted: "#f5f0eb",
  secondary: "#6366f1",
} as const;

export const colors = lightColors; // Backward compatibility
export type ThemeColors = typeof lightColors;

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
  xxl: 24,
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
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
