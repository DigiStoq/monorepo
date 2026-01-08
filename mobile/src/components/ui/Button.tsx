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
  variant,
  size,
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
  const handlePress = onPress || onClick;

  // Variant Styles
  const getBackgroundColor = () => {
    if (disabled) return "#e2e8f0";
    switch (variant) {
      case "default":
        return "#6366f1"; // Primary
      case "destructive":
        return "#ef4444";
      case "outline":
        return "transparent";
      case "secondary":
        return "#f1f5f9";
      case "ghost":
        return "transparent";
      case "link":
        return "transparent";
      default:
        return "#6366f1";
    }
  };

  const getBorderColor = () => {
    if (disabled) return "#e2e8f0";
    switch (variant) {
      case "outline":
        return "#e2e8f0";
      default:
        return "transparent";
    }
  };

  const getTextColor = () => {
    if (disabled) return "#94a3b8";
    switch (variant) {
      case "default":
        return "#ffffff";
      case "destructive":
        return "#ffffff";
      case "outline":
        return "#0f172a";
      case "secondary":
        return "#0f172a";
      case "ghost":
        return "#0f172a";
      case "link":
        return "#6366f1";
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

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === "outline" ? 1 : 0,
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
