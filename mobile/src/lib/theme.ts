/**
 * DigiStoq Light Theme Design System
 * Clean white theme with warm accents
 */

// Light Theme Colors
export const lightColors = {
  // Backgrounds
  background: "#f8fafc",     // slate-50
  backgroundLight: "#ffffff", // white
  backgroundCard: "#ffffff",  // white
  
  // Accents & Brand
  primary: "#14b8a6",        // teal-500
  primaryLight: "#ccfbf1",   // teal-100
  primaryDark: "#0f766e",    // teal-700
  primaryMuted: "#f0fdfa",   // teal-50
  
  secondary: "#0f172a",      // slate-900 (using dark slate as secondary/headings)
  accent: "#8b5cf6",         // violet-500 (optional accent)
  
  // Surfaces
  surface: "#ffffff",
  surfaceHover: "#f1f5f9",   // slate-100
  surfaceActive: "#e2e8f0",  // slate-200
  
  // Text
  text: "#0f172a",          // slate-900
  textSecondary: "#475569", // slate-600
  textMuted: "#94a3b8",     // slate-400
  textOnPrimary: "#ffffff",
  textOnAccent: "#ffffff",
  
  // Status
  success: "#22c55e",       // green-500
  successMuted: "#dcfce7",  // green-100
  warning: "#f59e0b",       // amber-500
  warningMuted: "#fef3c7",  // amber-100
  danger: "#ef4444",        // red-500
  dangerMuted: "#fee2e2",   // red-100
  info: "#3b82f6",          // blue-500
  infoMuted: "#dbeafe",     // blue-100
  
  // Borders
  border: "#e2e8f0",        // slate-200
  borderLight: "#f1f5f9",   // slate-100
  
  // Legacy mappings for compatibility
  accentLight: "#ccfbf1",
  accentDark: "#0f766e",
} as const;

// Dark Theme Colors
export const darkColors = {
  // Backgrounds
  background: "#0f172a",     // slate-900
  backgroundLight: "#1e293b", // slate-800
  backgroundCard: "#1e293b",  // slate-800
  
  // Accents & Brand
  primary: "#2dd4bf",        // teal-400 (brighter for dark mode)
  primaryLight: "#134e4a",   // teal-900
  primaryDark: "#5eead4",    // teal-300
  primaryMuted: "#022c22",   // teal-950
  
  secondary: "#e2e8f0",      // slate-200
  accent: "#a78bfa",         // violet-400
  
  // Surfaces
  surface: "#1e293b",      // slate-800
  surfaceHover: "#334155", // slate-700
  surfaceActive: "#475569", // slate-600
  
  // Text
  text: "#f8fafc",          // slate-50
  textSecondary: "#cbd5e1", // slate-300
  textMuted: "#94a3b8",     // slate-400
  textOnPrimary: "#0f172a", // slate-900 (black on teal)
  textOnAccent: "#ffffff",
  
  // Status
  success: "#4ade80",       // green-400
  successMuted: "rgba(34, 197, 94, 0.2)",
  warning: "#fbbf24",       // amber-400
  warningMuted: "rgba(245, 158, 11, 0.2)",
  danger: "#f87171",        // red-400
  dangerMuted: "rgba(239, 68, 68, 0.2)",
  info: "#60a5fa",          // blue-400
  infoMuted: "rgba(59, 130, 246, 0.2)",
  
  // Borders
  border: "#334155",      // slate-700
  borderLight: "#1e293b", // slate-800
  
  // Legacy mappings for compatibility
  accentLight: "#134e4a",
  accentDark: "#5eead4",
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
