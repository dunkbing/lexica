import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAppStore } from "@/store";
import { BorderRadius, FontSizes, FontWeights, Spacing } from "@/constants/theme";

export function BottomNav() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);

  const backgroundColor = useThemeColor({}, "background");
  const cardBackground = useThemeColor({}, "cardBackground");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const borderColor = useThemeColor({}, "borderLight");

  const handlePress = (route: string) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  const isHome = pathname === "/" || pathname === "/index";

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + Spacing.md,
          backgroundColor,
        },
      ]}
    >
      <View style={styles.nav}>
        {/* Categories Button */}
        <TouchableOpacity
          style={[
            styles.iconButton,
            { backgroundColor: cardBackground, borderColor },
          ]}
          onPress={() => handlePress("/categories")}
          activeOpacity={0.7}
        >
          <IconSymbol name="square.grid.2x2" size={24} color={textColor} />
        </TouchableOpacity>

        {/* Practice Button */}
        <TouchableOpacity
          style={[
            styles.practiceButton,
            { backgroundColor: cardBackground, borderColor },
          ]}
          onPress={() => handlePress("/practice")}
          activeOpacity={0.7}
        >
          <IconSymbol name="graduationcap.fill" size={20} color={textColor} />
          <Text style={[styles.practiceText, { color: textColor }]}>
            {t("tabs.practice")}
          </Text>
        </TouchableOpacity>

        {/* Stats Button */}
        <TouchableOpacity
          style={[
            styles.iconButton,
            { backgroundColor: cardBackground, borderColor },
          ]}
          onPress={() => handlePress("/stats")}
          activeOpacity={0.7}
        >
          <IconSymbol name="chart.bar.fill" size={24} color={textColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  practiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  practiceText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
});
