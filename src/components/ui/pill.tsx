import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

import { useThemeColor } from "@/hooks/use-theme-color";
import { useAppStore } from "@/store";
import { BorderRadius, FontSizes, Spacing } from "@/constants/theme";

interface PillProps {
  text: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "primary" | "secondary";
  size?: "sm" | "md";
  style?: ViewStyle;
}

export function Pill({
  text,
  icon,
  onPress,
  variant = "default",
  size = "md",
  style,
}: PillProps) {
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const primaryColor = useThemeColor({}, "primary");
  const chipColor = useThemeColor({}, "chip");
  const chipTextColor = useThemeColor({}, "chipText");
  const pronunciationPill = useThemeColor({}, "pronunciationPill");

  const handlePress = () => {
    if (!onPress) return;
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const variantStyles: Record<string, { bg: string; text: string }> = {
    default: { bg: pronunciationPill, text: chipTextColor },
    primary: { bg: `${primaryColor}20`, text: primaryColor },
    secondary: { bg: chipColor, text: chipTextColor },
  };

  const sizeStyles = {
    sm: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      fontSize: FontSizes.xs,
    },
    md: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      fontSize: FontSizes.sm,
    },
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.pill,
        {
          backgroundColor: variantStyles[variant].bg,
          paddingVertical: sizeStyles[size].paddingVertical,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            color: variantStyles[variant].text,
            fontSize: sizeStyles[size].fontSize,
          },
        ]}
      >
        {text}
      </Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    fontWeight: "500",
  },
});
