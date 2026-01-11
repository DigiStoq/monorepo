import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightColors, darkColors, type ThemeColors } from "../lib/theme";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
    mode: ThemeMode;
    isDark: boolean;
    colors: ThemeColors;
    setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "user_theme_preference";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>("system");

    // Load saved preference on mount
    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedMode && ["light", "dark", "system"].includes(savedMode)) {
                setModeState(savedMode as ThemeMode);
            }
        } catch (error) {
            console.error("Failed to load theme preference:", error);
        }
    };

    const setMode = async (newMode: ThemeMode) => {
        try {
            setModeState(newMode);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
        } catch (error) {
            console.error("Failed to save theme preference:", error);
        }
    };

    const isDark =
        mode === "dark" || (mode === "system" && systemColorScheme === "dark");

    const colors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ mode, isDark, colors, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
