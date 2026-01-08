import React from "react";
import type { TextInputProps, StyleProp, ViewStyle } from "react-native";
import { TextInput, Text, View, StyleSheet } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  containerStyle,
  fullWidth,
  style,
  ...props
}: InputProps) {
  return (
    <View
      style={[styles.container, fullWidth && styles.fullWidth, containerStyle]}
    >
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  fullWidth: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    height: 44,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#0f172a",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
});
