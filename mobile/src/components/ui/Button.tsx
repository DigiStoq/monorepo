import type React from "react";
import type { GestureResponderEvent, StyleProp, ViewStyle } from "react-native";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TextStyle,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string; // Kept for compatibility but unused
  children?: React.ReactNode;
  onClick?: (event: GestureResponderEvent) => void; // Web API compat
  onPress?: (event: GestureResponderEvent) => void; // Native API
  disabled?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  variant = "default",
  size = "default",
  children,
  onClick,
  onPress,
  disabled,
  isLoading,
  leftIcon,
  rightIcon,
  fullWidth,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const handlePress = onPress || onClick;

  // Variant Styles
  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceHover;
    switch (variant) {
      case "default":
        return colors.primary;
      case "destructive":
        return colors.danger;
      case "outline":
        return "transparent";
      case "secondary":
        return colors.surfaceHover;
      case "ghost":
        return "transparent";
      case "link":
        return "transparent";
      default:
        return colors.primary;
    }
  };

  const getBorderColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case "outline":
        return colors.border;
      default:
        return "transparent";
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case "default":
        return "#ffffff";
      case "destructive":
        return "#ffffff";
      case "outline":
        return colors.text;
      case "secondary":
        return colors.text;
      case "ghost":
        return colors.text;
      case "link":
        return colors.primary;
      default:
        return "#ffffff";
    }
  };

  // Size Styles
  const getPadding = () => {
    switch (size) {
      case "sm":
        return { paddingVertical: 8, paddingHorizontal: 12 };
      case "lg":
        return { paddingVertical: 14, paddingHorizontal: 24 };
      case "icon":
        return { padding: 10, width: 40, height: 40, justifyContent: "center" };
      default:
        return { paddingVertical: 12, paddingHorizontal: 16 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm":
        return 14;
      case "lg":
        return 16;
      default:
        return 14;
    }
  };

  const isDisabled = disabled || isLoading;
  const bgColor = getBackgroundColor();

  // Opacity for disabled state if not handled by color
  const opacity = isDisabled && variant !== "outline" && variant !== "ghost" ? 0.7 : 1;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor: getBorderColor(),
          borderWidth: variant === "outline" ? 1 : 0,
          opacity: opacity,
          ...(getPadding() as ViewStyle),
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getTextSize(),
                textDecorationLine: variant === "link" ? "underline" : "none",
              },
            ]}
          >
            {children}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  fullWidth: {
    width: "100%",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "500",
    textAlign: "center",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
