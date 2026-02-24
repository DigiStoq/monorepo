import React, { useRef, useEffect } from "react";
import type {
  LayoutChangeEvent} from "react-native";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated
} from "react-native";
import { spacing, borderRadius, fontSize, fontWeight } from "../lib/theme";
import { useTheme } from "../contexts/ThemeContext";

interface Segment {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  activeValue: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({
  segments,
  activeValue,
  onChange,
}: SegmentedControlProps) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = React.useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const segmentWidth = containerWidth / segments.length;
  const activeIndex = segments.findIndex((s) => s.value === activeValue);

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: activeIndex * segmentWidth,
      useNativeDriver: true,
      tension: 68,
      friction: 10,
    }).start();
  }, [activeIndex, segmentWidth]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceHover }]} onLayout={handleLayout}>
      {/* Animated Background */}
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.activeBackground,
            {
              width: segmentWidth - 8,
              transform: [{ translateX }],
              backgroundColor: colors.surface,
            },
          ]}
        />
      )}

      {/* Segments */}
      {segments.map((segment) => {
        const isActive = segment.value === activeValue;
        return (
          <TouchableOpacity
            key={segment.value}
            style={styles.segment}
            onPress={() => { onChange(segment.value); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, { color: colors.textSecondary }, isActive && { color: colors.text, fontWeight: fontWeight.semibold }]}>
              {segment.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: borderRadius.full,
    padding: 4,
    position: "relative",
  },
  activeBackground: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: borderRadius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  segmentText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});

export default SegmentedControl;
