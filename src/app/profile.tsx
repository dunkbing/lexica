import React, { useMemo, useCallback, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { StatTile } from "@/components/ui/stat-tile";
import { CategoryRow } from "@/components/ui/category-row";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useUserStore } from "@/store/userStore";
import { FontSizes, FontWeights, Spacing } from "@/constants/theme";

const SCROLL_THRESHOLD = 50;

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const cardBackground = useThemeColor({}, "cardBackground");

  const stats = useUserStore((s) => s.stats);
  const collections = useUserStore((s) => s.collections);
  const wordStates = useUserStore((s) => s.wordStates);

  const snapPoints = useMemo(() => ["95%"], []);
  const scrollY = useSharedValue(0);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const largeTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, SCROLL_THRESHOLD],
        [1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  const smallTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [SCROLL_THRESHOLD - 20, SCROLL_THRESHOLD],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  });

  const { favoriteCount } = useMemo(() => {
    const states = Object.values(wordStates);
    return {
      favoriteCount: states.filter((ws) => ws.isFavorite).length,
    };
  }, [wordStates]);

  const menuItems = [
    {
      id: "favorites",
      title: t("profile.favorites"),
      subtitle: t("profile.itemCount", { count: favoriteCount }),
      icon: "heart.fill",
      color: "#FCE4EC",
      route: "/lists/favorites",
    },
    {
      id: "collections",
      title: t("profile.collections"),
      subtitle: t("profile.itemCount", { count: collections.length }),
      icon: "folder.fill",
      color: "#E8F5E9",
      route: "/lists/collections",
    },
    {
      id: "history",
      title: t("profile.history"),
      subtitle: t("profile.recentlyViewed"),
      icon: "clock.fill",
      color: "#FFF3E0",
      route: "/lists/history",
    },
  ];

  const settingsItems = [
    {
      id: "customize",
      title: t("profile.customize"),
      icon: "paintbrush.fill",
      route: "/settings",
    },
    {
      id: "notifications",
      title: t("profile.notifications"),
      icon: "bell.fill",
      route: "/settings",
    },
    {
      id: "language",
      title: t("profile.language"),
      icon: "globe",
      route: "/settings",
    },
  ];

  return (
    <View style={styles.container}>
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        onClose={handleClose}
        backgroundStyle={{ backgroundColor }}
        handleIndicatorStyle={{ backgroundColor: textSecondary }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: cardBackground }]}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <IconSymbol name="xmark" size={16} color={textSecondary} />
          </TouchableOpacity>

          <Animated.Text
            style={[styles.smallTitle, { color: textColor }, smallTitleStyle]}
          >
            {t("profile.title")}
          </Animated.Text>

          <View style={styles.headerSpacer} />
        </View>

        <BottomSheetScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Spacing.xl * 2 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            scrollY.value = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {/* Large Title */}
          <Animated.Text
            style={[styles.largeTitle, { color: textColor }, largeTitleStyle]}
          >
            {t("profile.title")}
          </Animated.Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatTile
              value={stats.currentStreak}
              label={t("stats.dayStreak")}
              icon={<IconSymbol name="flame.fill" size={24} color="#FF9800" />}
              style={styles.statTile}
            />
            <StatTile
              value={stats.totalRead}
              label={t("stats.wordsLearned")}
              icon={
                <IconSymbol name="book.fill" size={24} color={primaryColor} />
              }
              style={styles.statTile}
            />
          </View>

          {/* Menu Items */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t("profile.yourWords")}
            </Text>
            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <CategoryRow
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  icon={
                    <IconSymbol
                      name={item.icon as never}
                      size={22}
                      color={primaryColor}
                    />
                  }
                  onPress={() => router.push(item.route as never)}
                  color={item.color}
                />
              ))}
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t("profile.settings")}
            </Text>
            <View style={styles.menuList}>
              {settingsItems.map((item) => (
                <CategoryRow
                  key={item.id}
                  title={item.title}
                  icon={
                    <IconSymbol
                      name={item.icon as never}
                      size={22}
                      color={textSecondary}
                    />
                  }
                  onPress={() => router.push(item.route as never)}
                />
              ))}
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  smallTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  largeTitle: {
    fontSize: 32,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: FontSizes.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statTile: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.md,
  },
  menuList: {
    gap: Spacing.md,
  },
});
