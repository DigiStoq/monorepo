import type React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeftIcon } from "./ui/UntitledIcons";
import { useTheme } from "../contexts/ThemeContext";

interface CustomHeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function CustomHeader({ title, showBack, rightAction }: CustomHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const canGoBack = showBack || navigation.canGoBack();

  return (
    <View
      className="bg-surface border-b border-border-light z-[100] shadow-sm"
    >
      <View className="flex-row items-center justify-between px-3 py-4">
        {/* Left Section: Back Btn or Logo */}
        <View className="flex-1 items-start justify-center">
          {canGoBack ? (
            <TouchableOpacity
              onPress={() => { navigation.goBack(); }}
              className="p-1.5 justify-center items-center"
            >
              <ArrowLeftIcon color={colors.text} size={24} strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            // Logo / Branding for Root Screens
            <View className="flex-row items-center gap-2">
              {/* Placeholder for Icon - using Text for now */}
              <View className="w-7 h-7 rounded-lg bg-primary justify-center items-center">
                <Text className="text-white font-[900] text-lg">D</Text>
              </View>
              <Text className="text-lg font-extrabold text-text -tracking-[0.5px]">DigiStoq</Text>
            </View>
          )}
        </View>

        {/* Center Section: Title (Only if back button is present or explicit title) */}
        <View className="flex-[2] items-center justify-center">
          {title && (
            <Text className="text-[17px] font-bold text-text text-center" numberOfLines={1}>{title}</Text>
          )}
        </View>

        {/* Right Section: Actions */}
        <View className="flex-1 items-end justify-center">
          {rightAction ?? null}
        </View>
      </View>
    </View>
  );
}
