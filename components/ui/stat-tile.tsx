import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import {
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";

interface StatTileProps {
  value: number | string;
  label: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function StatTile({ value, label, icon, style }: StatTileProps) {
  const cardBackground = useThemeColor({}, "cardBackground");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "borderLight");

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: cardBackground,
          borderColor,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.value, { color: textColor }]}>{value}</Text>
        <Text style={[styles.label, { color: textSecondary }]}>{label}</Text>
      </View>
      {icon && <View style={styles.icon}>{icon}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
  },
  label: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  icon: {
    marginLeft: Spacing.md,
  },
});
