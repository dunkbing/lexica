import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";

import { useThemeColor } from "@/hooks/use-theme-color";
import { useAppStore } from "@/store";
import { BorderRadius, FontSizes, FontWeights, Spacing } from "@/constants/theme";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: "filled" | "outlined" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function PrimaryButton({
  title,
  onPress,
  variant = "filled",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: PrimaryButtonProps) {
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");

  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const sizeStyles = {
    sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
    md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
    lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl },
  };

  const textSizes = {
    sm: FontSizes.sm,
    md: FontSizes.md,
    lg: FontSizes.lg,
  };

  const variantStyles: Record<string, ViewStyle> = {
    filled: {
      backgroundColor: disabled ? `${primaryColor}60` : primaryColor,
    },
    outlined: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: disabled ? `${primaryColor}60` : primaryColor,
    },
    ghost: {
      backgroundColor: "transparent",
    },
  };

  const variantTextStyles: Record<string, TextStyle> = {
    filled: {
      color: "#FFFFFF",
    },
    outlined: {
      color: disabled ? `${primaryColor}60` : primaryColor,
    },
    ghost: {
      color: disabled ? `${textColor}60` : primaryColor,
    },
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "filled" ? "#FFFFFF" : primaryColor}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { fontSize: textSizes[size] },
              variantTextStyles[variant],
              icon ? styles.textWithIcon : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    fontWeight: FontWeights.semibold,
  },
  textWithIcon: {
    marginLeft: Spacing.sm,
  },
});
