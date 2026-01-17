/**
 * Theme color hook that respects user's theme preference from app store
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "react-native";
import { useAppStore } from "@/store";

export type ColorScheme = "light" | "dark";

/**
 * Get the effective color scheme based on user preference
 * Returns 'light' or 'dark' based on the theme setting in app store
 */
export function useEffectiveColorScheme(): ColorScheme {
  const systemColorScheme = useColorScheme();
  const themePreference = useAppStore((state) => state.theme);

  if (themePreference === "system") {
    return systemColorScheme === "dark" ? "dark" : "light";
  }

  return themePreference;
}

/**
 * Get a theme color based on the current effective theme
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const theme = useEffectiveColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
