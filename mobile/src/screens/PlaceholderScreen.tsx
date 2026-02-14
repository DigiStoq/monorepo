import React from "react";
import { View, Text, StyleSheet } from "react-native";

export function PlaceholderScreen({ route }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{route.name} Screen</Text>
      <Text style={styles.subtext}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subtext: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 8,
  },
});
