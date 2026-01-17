import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

import { useThemeColor } from "@/hooks/use-theme-color";
import { useAppStore } from "@/store";
import {
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";

interface PracticeTileProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  color?: string;
}

export function PracticeTile({
  title,
  icon,
  onPress,
  color,
}: PracticeTileProps) {
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const cardBackground = useThemeColor({}, "cardBackground");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "borderLight");
  const primaryColor = useThemeColor({}, "primary");

  const handlePress = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: cardBackground,
          borderColor,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: color || `${primaryColor}15` },
        ]}
      >
        {icon}
      </View>
      <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    minHeight: 120,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    textAlign: "center",
  },
});
