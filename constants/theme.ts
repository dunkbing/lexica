/**
 * Vocabulary Learning App Color Theme
 * Light theme - warm, inviting, soft
 * Dark theme - comfortable for night learning
 */

import { Platform } from "react-native";

// Light theme colors - Warm & Inviting
const lightColors = {
  primary: "#5B9A8B", // Sage teal - calming, focused
  onPrimary: "#FFFFFF",
  primaryContainer: "#E8F4F1",
  onPrimaryContainer: "#2D5A50",
  secondary: "#7C9885", // Muted green
  onSecondary: "#FFFFFF",
  secondaryContainer: "#E8F0EA",
  onSecondaryContainer: "#3D5243",
  tertiary: "#E8A87C", // Warm peach
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FDF4EE",
  onTertiaryContainer: "#8B5A3C",
  accent: "#F2C94C", // Golden yellow for streaks
  error: "#E57373",
  errorContainer: "#FDEAEA",
  onError: "#FFFFFF",
  onErrorContainer: "#8B3D39",
  background: "#FAF8F5", // Warm off-white
  onBackground: "#2D2D2D",
  surface: "#FFFFFF",
  onSurface: "#2D2D2D",
  surfaceVariant: "#F5F2EE", // Warm light gray
  onSurfaceVariant: "#6B6B6B",
  outline: "#E0DCD5", // Warm border
  outlineVariant: "#EAE6E0",
  success: "#6AAF8D", // Soft green
  warning: "#F5A623", // Orange
};

// Dark theme colors
const darkColors = {
  primary: "#7BC4B5", // Lighter sage teal for dark mode
  onPrimary: "#1A1A1A",
  primaryContainer: "#2D5A50",
  onPrimaryContainer: "#E8F4F1",
  secondary: "#9CB8A3",
  onSecondary: "#1A1A1A",
  secondaryContainer: "#3D5243",
  onSecondaryContainer: "#E8F0EA",
  tertiary: "#F0B896",
  onTertiary: "#1A1A1A",
  tertiaryContainer: "#8B5A3C",
  onTertiaryContainer: "#FDF4EE",
  accent: "#F2C94C",
  error: "#FF8A80",
  errorContainer: "#2D1B1B",
  onError: "#1A1A1A",
  onErrorContainer: "#FFCDD2",
  background: "#1C1C1E", // Dark gray
  onBackground: "#F5F5F5",
  surface: "#2C2C2E",
  onSurface: "#F5F5F5",
  surfaceVariant: "#3A3A3C",
  onSurfaceVariant: "#C7C7CC",
  outline: "#48484A",
  outlineVariant: "#3A3A3C",
  success: "#81C995",
  warning: "#FFB74D",
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
    sheetHandle: "#D1D5DB",
    divider: "#E5E7EB",
    muted: "#9CA3AF",
    placeholder: "#B8B5B0",
    chip: lightColors.surfaceVariant,
    chipText: lightColors.onSurfaceVariant,
    // Word card specific
    wordCardBg: "#FFFFFF",
    pronunciationPill: lightColors.surfaceVariant,
    // Game specific
    correctAnswer: "#D4EDDA",
    incorrectAnswer: "#F8D7DA",
    selectedOption: lightColors.primaryContainer,
    // Streak
    streakFire: "#FF6B35",
    streakInactive: "#E0DCD5",
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
    sheetHandle: "#4B5563",
    divider: "#3A3A3C",
    muted: "#9CA3AF",
    placeholder: "#6B7280",
    chip: darkColors.surfaceVariant,
    chipText: darkColors.onSurfaceVariant,
    // Word card specific
    wordCardBg: darkColors.surface,
    pronunciationPill: darkColors.surfaceVariant,
    // Game specific
    correctAnswer: "#1E3A28",
    incorrectAnswer: "#3A1E1E",
    selectedOption: darkColors.primaryContainer,
    // Streak
    streakFire: "#FF6B35",
    streakInactive: "#48484A",
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
