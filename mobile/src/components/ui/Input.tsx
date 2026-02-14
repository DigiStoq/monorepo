import type React from "react";
import type { TextInputProps, ViewStyle } from "react-native";
import { View, Text, TextInput } from "react-native";
import { cn } from "../../lib/utils";
import { colors } from "../../lib/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  className,
  containerClassName,
  containerStyle,
  icon,
  ...props
}: InputProps) {
  return (
    <View className={cn("gap-1.5", containerClassName)} style={containerStyle}>
      {label && (
        <Text className="text-sm font-medium text-text-secondary ml-1">
          {label}
        </Text>
      )}

      <View className={cn(
        "flex-row items-center border border-border rounded-xl bg-surface px-3 py-3",
        error ? "border-danger" : "focus:border-primary",
        props.editable === false ? "bg-surface-hover opacity-60" : ""
      )}>
        {icon && <View className="mr-2">{icon}</View>}

        <TextInput
          className={cn("flex-1 text-base text-text", className)}
          placeholderTextColor={colors.textMuted} // Native prop needed for placeholder color
          {...props}
        />
      </View>

      {error && (
        <Text className="text-xs text-danger ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}
