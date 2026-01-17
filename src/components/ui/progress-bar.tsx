import React from "react";
import { View, StyleSheet, Text, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/use-theme-color";

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  showLabel?: boolean;
  label?: string;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 8,
  showLabel = false,
  label,
  color,
  backgroundColor,
  style,
}: ProgressBarProps) {
  const tintColor = useThemeColor({}, "tint");
  const defaultBgColor = useThemeColor({}, "divider");
  const textColor = useThemeColor({}, "text");

  const actualColor = color || tintColor;
  const actualBgColor = backgroundColor || defaultBgColor;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${clampedProgress * 100}%`, {
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }),
  }));

  return (
    <View style={style}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: textColor }]}>
            {label || `${Math.round(clampedProgress * 100)}%`}
          </Text>
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: actualBgColor }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: actualColor }, animatedStyle]}
        />
      </View>
    </View>
  );
}

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  progress,
  size = 80,
  strokeWidth = 8,
  color,
  backgroundColor,
  children,
}: CircularProgressProps) {
  const defaultBgColor = useThemeColor({}, "divider");

  const actualBgColor = backgroundColor || defaultBgColor;

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      <View style={StyleSheet.absoluteFill}>
        {/* Background circle */}
        <View
          style={[
            styles.circularTrack,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: actualBgColor,
            },
          ]}
        />
      </View>
      {/* This would be better with SVG for proper arc rendering */}
      <View style={styles.circularContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 100,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 100,
  },
  labelContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
  circularContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  circularTrack: {
    position: "absolute",
  },
  circularContent: {
    justifyContent: "center",
    alignItems: "center",
  },
});
