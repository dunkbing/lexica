import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

import { useThemeColor } from "@/hooks/use-theme-color";
import { useAppStore } from "@/store";
import { BorderRadius, Spacing } from "@/constants/theme";

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
  disabled?: boolean;
  style?: ViewStyle;
  hapticType?: "light" | "medium" | "success" | "warning" | "error";
}

export function IconButton({
  icon,
  onPress,
  size = "md",
  variant = "default",
  disabled = false,
  style,
  hapticType = "light",
}: IconButtonProps) {
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const primaryColor = useThemeColor({}, "primary");
  const surfaceVariant = useThemeColor({}, "surfaceVariant");

  const handlePress = () => {
    if (disabled) return;
    if (hapticsEnabled) {
      switch (hapticType) {
        case "success":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "warning":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case "error":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case "medium":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    onPress();
  };

  const sizeMap = {
    sm: 36,
    md: 44,
    lg: 52,
  };

  const variantStyles: Record<string, ViewStyle> = {
    default: {},
    filled: {
      backgroundColor: primaryColor,
    },
    outlined: {
      backgroundColor: surfaceVariant,
    },
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: sizeMap[size],
          height: sizeMap[size],
          borderRadius: sizeMap[size] / 2,
        },
        variantStyles[variant],
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
