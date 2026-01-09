/**
 * DigiStoq Light Theme Design System
 * Clean white theme with warm accents
 */

export const colors = {
  // Light Background
  background: "#f8fafc",
  backgroundLight: "#ffffff",
  backgroundCard: "#ffffff",
  
  // Primary Accent
  accent: "#C4A484",
  accentLight: "#d4b494",
  accentDark: "#a48a6a",
  
  // Surface Colors
  surface: "#ffffff",
  surfaceHover: "#f1f5f9",
  surfaceActive: "#e2e8f0",
  
  // Text Colors
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  textOnAccent: "#ffffff",
  
  // Status Colors
  success: "#22c55e",
  successMuted: "#dcfce7",
  warning: "#f59e0b",
  warningMuted: "#fef3c7",
  danger: "#ef4444",
  dangerMuted: "#fee2e2",
  info: "#3b82f6",
  infoMuted: "#dbeafe",
  
  // Borders
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  
  // Legacy compatibility
  primary: "#C4A484",
  primaryLight: "#d4b494",
  primaryMuted: "#f5f0eb",
  secondary: "#6366f1",
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
