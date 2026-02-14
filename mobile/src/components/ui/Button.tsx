import { type ReactNode } from "react";
import type { TouchableOpacityProps } from "react-native";
import { Text, TouchableOpacity, ActivityIndicator, View } from "react-native";
import { cn } from "../../lib/utils";

interface ButtonProps extends TouchableOpacityProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  isLoading?: boolean; // alias for loading
  block?: boolean;
  fullWidth?: boolean; // alias for block
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  textClassName?: string;
}

/* eslint-disable @typescript-eslint/no-useless-default-assignment */
export function Button({
  variant = "primary",
  size = "md",
  loading,
  isLoading,
  block,
  fullWidth,
  label,
  leftIcon,
  rightIcon,
  className,
  textClassName,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isButtonLoading = loading || isLoading;
  const baseStyles = "flex-row items-center justify-center rounded-xl";

  const variants = {
    primary: "bg-primary active:bg-primary-dark",
    secondary: "bg-secondary active:opacity-90",
    outline: "bg-transparent border border-border active:bg-surface-hover",
    ghost: "bg-transparent active:bg-surface-hover",
    danger: "bg-danger active:opacity-90",
  };

  const sizes = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-6 py-4",
    icon: "p-2 aspect-square",
  };

  const textBaseStyles = "font-semibold text-center";

  const textVariants = {
    primary: "text-white",
    secondary: "text-white",
    outline: "text-text",
    ghost: "text-text",
    danger: "text-white",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    icon: "text-sm",
  };

  const renderContent = () => {
    if (isButtonLoading) {
      return (
        <ActivityIndicator color={variant === "outline" || variant === "ghost" ? "#0f172a" : "#ffffff"} />
      );
    }

    return (
      <View className="flex-row items-center">
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        {children ? (
          typeof children === "string" ? (
            <Text className={cn(textBaseStyles, textVariants[variant], textSizes[size], textClassName)}>
              {children}
            </Text>
          ) : (
            children
          )
        ) : (
          label && (
            <Text className={cn(textBaseStyles, textVariants[variant], textSizes[size], textClassName)}>
              {label}
            </Text>
          )
        )}
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
    );
  };

  return (
    <TouchableOpacity
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        block || fullWidth ? "w-full" : "self-around",
        disabled || isButtonLoading ? "opacity-60" : "",
        className
      )}
      disabled={disabled || isButtonLoading}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}
