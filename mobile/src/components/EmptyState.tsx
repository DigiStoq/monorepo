import { View, Text } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, message, icon }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-1 justify-center items-center px-8 py-16">
      {icon && <View className="mb-4">{icon}</View>}
      <Text
        className="text-lg font-semibold text-center mb-2"
        style={{ color: colors.text }}
      >
        {title}
      </Text>
      {message && (
        <Text
          className="text-sm text-center leading-5"
          style={{ color: colors.textMuted }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
