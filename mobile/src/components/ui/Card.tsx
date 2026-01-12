import type React from "react";
import type { ViewStyle, StyleProp } from "react-native";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps {
  title?: string;
  className?: string; // compat
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function CardHeader({ title, action, style }: CardHeaderProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.header,
        { borderBottomColor: colors.borderLight },
        style
      ]}
    >
      {title && <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>}
      {action && <View>{action}</View>}
    </View>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string; // compat
}

export function CardBody({ children, style }: CardBodyProps) {
  return <View style={[styles.body, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
  },
  body: {
    padding: 16,
  },
});
