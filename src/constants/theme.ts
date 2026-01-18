/**
 * Vocabulary Learning App Color Theme
 * Light theme - warm, inviting, soft
 * Dark theme - comfortable for night learning
 */

import { Platform } from "react-native";

// Light theme colors - Black/white grayscale
const lightColors = {
  primary: "#111111",
  onPrimary: "#FFFFFF",
  primaryContainer: "#E5E5E5",
  onPrimaryContainer: "#111111",
  secondary: "#2A2A2A",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#F0F0F0",
  onSecondaryContainer: "#1A1A1A",
  tertiary: "#3A3A3A",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#F5F5F5",
  onTertiaryContainer: "#1A1A1A",
  accent: "#000000",
  error: "#1A1A1A",
  errorContainer: "#E5E5E5",
  onError: "#FFFFFF",
  onErrorContainer: "#111111",
  background: "#FAFAFA",
  onBackground: "#1A1A1A",
  surface: "#FFFFFF",
  onSurface: "#1A1A1A",
  surfaceVariant: "#F0F0F0",
  onSurfaceVariant: "#6A6A6A",
  outline: "#D6D6D6",
  outlineVariant: "#E5E5E5",
  success: "#2A2A2A",
  warning: "#3A3A3A",
};

// Dark theme colors - Black/white grayscale
const darkColors = {
  primary: "#F0F0F0",
  onPrimary: "#111111",
  primaryContainer: "#2A2A2A",
  onPrimaryContainer: "#F5F5F5",
  secondary: "#D6D6D6",
  onSecondary: "#111111",
  secondaryContainer: "#3A3A3A",
  onSecondaryContainer: "#F0F0F0",
  tertiary: "#C5C5C5",
  onTertiary: "#111111",
  tertiaryContainer: "#4A4A4A",
  onTertiaryContainer: "#FAFAFA",
  accent: "#FFFFFF",
  error: "#E5E5E5",
  errorContainer: "#2A2A2A",
  onError: "#111111",
  onErrorContainer: "#F0F0F0",
  background: "#111111",
  onBackground: "#FAFAFA",
  surface: "#1A1A1A",
  onSurface: "#FAFAFA",
  surfaceVariant: "#2A2A2A",
  onSurfaceVariant: "#B0B0B0",
  outline: "#3A3A3A",
  outlineVariant: "#2A2A2A",
  success: "#D6D6D6",
  warning: "#C5C5C5",
};

export const Colors = {
  light: {
    text: lightColors.onSurface,
    textSecondary: lightColors.onSurfaceVariant,
    background: lightColors.background,
    tint: lightColors.primary,
    icon: lightColors.onSurfaceVariant,
    tabIconDefault: "#B8B5B0",
    tabIconSelected: lightColors.primary,
    surface: lightColors.surface,
    surfaceVariant: lightColors.surfaceVariant,
    border: lightColors.outline,
    borderLight: lightColors.outlineVariant,
    primary: lightColors.primary,
    secondary: lightColors.secondary,
    tertiary: lightColors.tertiary,
    accent: lightColors.accent,
    error: lightColors.error,
    success: lightColors.success,
    warning: lightColors.warning,
    card: lightColors.surface,
    cardBorder: lightColors.outline,
    // UI specific
    cardBackground: "#FFFFFF",
    inputBackground: lightColors.surfaceVariant,
    sheetBackground: "#FFFFFF",
    sheetHandle: "#B0B0B0",
    divider: "#E5E5E5",
    muted: "#8A8A8A",
    placeholder: "#9A9A9A",
    chip: lightColors.surfaceVariant,
    chipText: lightColors.onSurfaceVariant,
    // Word card specific
    wordCardBg: "#FFFFFF",
    pronunciationPill: lightColors.surfaceVariant,
    // Game specific
    correctAnswer: "#E5E5E5",
    incorrectAnswer: "#D6D6D6",
    selectedOption: lightColors.primaryContainer,
    // Streak
    streakFire: "#111111",
    streakInactive: "#D6D6D6",
    streakActive: lightColors.primary,
  },
  dark: {
    text: darkColors.onSurface,
    textSecondary: darkColors.onSurfaceVariant,
    background: darkColors.background,
    tint: darkColors.primary,
    icon: darkColors.onSurfaceVariant,
    tabIconDefault: darkColors.outline,
    tabIconSelected: darkColors.primary,
    surface: darkColors.surface,
    surfaceVariant: darkColors.surfaceVariant,
    border: darkColors.outline,
    borderLight: darkColors.outlineVariant,
    primary: darkColors.primary,
    secondary: darkColors.secondary,
    tertiary: darkColors.tertiary,
    accent: darkColors.accent,
    error: darkColors.error,
    success: darkColors.success,
    warning: darkColors.warning,
    card: darkColors.surface,
    cardBorder: darkColors.outline,
    // UI specific
    cardBackground: darkColors.surfaceVariant,
    inputBackground: darkColors.surfaceVariant,
    sheetBackground: darkColors.surface,
    sheetHandle: "#6A6A6A",
    divider: "#3A3A3A",
    muted: "#B0B0B0",
    placeholder: "#8A8A8A",
    chip: darkColors.surfaceVariant,
    chipText: darkColors.onSurfaceVariant,
    // Word card specific
    wordCardBg: darkColors.surface,
    pronunciationPill: darkColors.surfaceVariant,
    // Game specific
    correctAnswer: "#2A2A2A",
    incorrectAnswer: "#3A3A3A",
    selectedOption: darkColors.primaryContainer,
    // Streak
    streakFire: "#FFFFFF",
    streakInactive: "#3A3A3A",
    streakActive: darkColors.primary,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Fonts = Platform.select({
  ios: {
    sans: "System",
    serif: "Georgia",
    mono: "Menlo",
  },
  default: {
    sans: "System",
    serif: "serif",
    mono: "monospace",
  },
});

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const FontWeights = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};
