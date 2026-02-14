/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#14b8a6", // teal-500
          light: "#ccfbf1",   // teal-100
          dark: "#0f766e",    // teal-700
          muted: "#f0fdfa",   // teal-50
        },
        secondary: "#0f172a", // slate-900
        accent: "#8b5cf6",    // violet-500
        background: {
          DEFAULT: "#f8fafc", // slate-50
          light: "#ffffff",
          card: "#ffffff",
          dark: "#0f172a",    // slate-900
        },
        surface: {
          DEFAULT: "#ffffff",
          hover: "#f1f5f9",   // slate-100
          active: "#e2e8f0",  // slate-200
          dark: "#1e293b",
        },
        text: {
          DEFAULT: "#0f172a", // slate-900
          secondary: "#475569", // slate-600
          muted: "#94a3b8",     // slate-400
          light: "#f8fafc",     // slate-50
        },
        success: {
          DEFAULT: "#22c55e",
          muted: "#dcfce7",
        },
        warning: {
          DEFAULT: "#f59e0b",
          muted: "#fef3c7",
        },
        danger: {
          DEFAULT: "#ef4444",
          muted: "#fee2e2",
        },
        info: {
          DEFAULT: "#3b82f6",
          muted: "#dbeafe",
        },
        border: {
          DEFAULT: "#e2e8f0",
          light: "#f1f5f9",
          dark: "#334155",
        }
      },
      fontFamily: {
        // Add custom fonts here if needed
      }
    },
  },
  plugins: [],
}

