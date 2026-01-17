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
import { IconSymbol } from "./icon-symbol";

interface CategoryRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  color?: string;
  showArrow?: boolean;
}

export function CategoryRow({
  title,
  subtitle,
  icon,
  onPress,
  color,
  showArrow = true,
}: CategoryRowProps) {
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const cardBackground = useThemeColor({}, "cardBackground");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
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
      {icon && (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: color || `${primaryColor}15` },
          ]}
        >
          {icon}
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {showArrow && (
        <IconSymbol
          name="chevron.right"
          size={18}
          color={textSecondary}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
});
