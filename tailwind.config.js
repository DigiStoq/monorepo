/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme-aware semantic colors (use CSS variables)
        app: "rgb(var(--color-bg-app) / <alpha-value>)",
        card: "rgb(var(--color-bg-card) / <alpha-value>)",
        elevated: "rgb(var(--color-bg-elevated) / <alpha-value>)",
        subtle: "rgb(var(--color-bg-subtle) / <alpha-value>)",
        muted: "rgb(var(--color-bg-muted) / <alpha-value>)",
        
        // Text colors
        "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-heading": "rgb(var(--color-text-heading) / <alpha-value>)",
        "text-number": "rgb(var(--color-text-number) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-tertiary": "rgb(var(--color-text-tertiary) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        
        // Border colors
        "border-primary": "rgb(var(--color-border-primary) / <alpha-value>)",
        "border-secondary": "rgb(var(--color-border-secondary) / <alpha-value>)",
        
        // Sidebar
        sidebar: {
          DEFAULT: "rgb(var(--color-sidebar-bg) / <alpha-value>)",
          hover: "rgb(var(--color-sidebar-hover) / <alpha-value>)",
          active: "rgb(var(--color-sidebar-active) / <alpha-value>)",
        },
        
        // Primary - Teal (using CSS variables for theme awareness)
        primary: {
          50: "rgb(var(--color-primary-50) / <alpha-value>)",
          100: "rgb(var(--color-primary-100) / <alpha-value>)",
          200: "rgb(var(--color-primary-200) / <alpha-value>)",
          300: "rgb(var(--color-primary-300) / <alpha-value>)",
          400: "rgb(var(--color-primary-400) / <alpha-value>)",
          500: "rgb(var(--color-primary-500) / <alpha-value>)",
          600: "rgb(var(--color-primary-600) / <alpha-value>)",
          700: "rgb(var(--color-primary-700) / <alpha-value>)",
          800: "rgb(var(--color-primary-800) / <alpha-value>)",
          900: "rgb(var(--color-primary-900) / <alpha-value>)",
        },
        
        // Semantic colors
        success: {
          light: "rgb(var(--color-success-light) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
          dark: "rgb(var(--color-success-dark) / <alpha-value>)",
        },
        warning: {
          light: "rgb(var(--color-warning-light) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-warning) / <alpha-value>)",
          dark: "rgb(var(--color-warning-dark) / <alpha-value>)",
        },
        error: {
          light: "rgb(var(--color-error-light) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-error) / <alpha-value>)",
          dark: "rgb(var(--color-error-dark) / <alpha-value>)",
        },
        info: {
          light: "rgb(var(--color-info-light) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-info) / <alpha-value>)",
          dark: "rgb(var(--color-info-dark) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: [
          "DM Sans",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }], // 10px
      },
      borderRadius: {
        DEFAULT: "0.625rem", // 10px
        lg: "1rem", // 16px
        xl: "1.5rem", // 24px
      },
      borderColor: {
        DEFAULT: "rgb(var(--color-border-primary) / <alpha-value>)",
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgb(0 0 0 / 0.08), 0 4px 16px -4px rgb(0 0 0 / 0.12)",
        card: "0 4px 12px -2px rgb(0 0 0 / 0.08), 0 8px 24px -4px rgb(0 0 0 / 0.1)",
        elevated:
          "0 8px 24px -4px rgb(0 0 0 / 0.12), 0 16px 48px -8px rgb(0 0 0 / 0.15)",
        "inner-soft": "inset 0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "fade-out": "fadeOut 0.2s ease-in",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      spacing: {
        sidebar: "240px",
        "sidebar-collapsed": "64px",
        header: "64px",
      },
      zIndex: {
        dropdown: "1000",
        sticky: "1100",
        overlay: "1300",
        modal: "1400",
        popover: "1500",
        toast: "1700",
        tooltip: "1800",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-mesh":
          "linear-gradient(135deg, var(--tw-gradient-from) 0%, var(--tw-gradient-via) 50%, var(--tw-gradient-to) 100%)",
      },
    },
  },
  plugins: [],
};
