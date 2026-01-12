import { useEffect, type ReactNode } from "react";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface ThemeProviderProps {
    children: ReactNode;
}

/**
 * ThemeProvider
 *
 * Applies the user's theme (light/dark/system) and compact mode preferences
 * to the <html> element by adding/removing CSS classes.
 */
export function ThemeProvider({ children }: ThemeProviderProps): ReactNode {
    const { preferences, isLoading } = useUserPreferences();

    useEffect(() => {
        if (isLoading) return;

        const root = document.documentElement;

        // --- Handle Theme ---
        const theme = preferences.theme ?? "system";

        const applyTheme = (isDark: boolean): void => {
            if (isDark) {
                root.classList.add("dark");
            } else {
                root.classList.remove("dark");
            }
        };

        let cleanupListener: (() => void) | undefined;

        if (theme === "dark") {
            applyTheme(true);
        } else if (theme === "light") {
            applyTheme(false);
        } else {
            // System preference
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            applyTheme(mediaQuery.matches);

            const handleChange = (e: MediaQueryListEvent): void => {
                applyTheme(e.matches);
            };

            mediaQuery.addEventListener("change", handleChange);
            cleanupListener = () => {
                mediaQuery.removeEventListener("change", handleChange);
            };
        }

        // --- Handle Compact Mode ---
        const compactMode = preferences.compactMode ?? false;
        if (compactMode) {
            root.classList.add("compact");
        } else {
            root.classList.remove("compact");
        }

        return cleanupListener;
    }, [preferences, isLoading]);

    return <>{children}</>;
}
