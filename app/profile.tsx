import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { StatTile } from "@/components/ui/stat-tile";
import { CategoryRow } from "@/components/ui/category-row";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useUserStore } from "@/store/userStore";
import {
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "borderLight");

  const stats = useUserStore((s) => s.stats);
  const collections = useUserStore((s) => s.collections);
  const wordStates = useUserStore((s) => s.wordStates);

  const { favoriteCount, savedCount } = useMemo(() => {
    const states = Object.values(wordStates);
    return {
      favoriteCount: states.filter((ws) => ws.isFavorite).length,
      savedCount: states.filter((ws) => ws.isSaved).length,
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
      id: "saved",
      title: t("profile.savedWords"),
      subtitle: t("profile.itemCount", { count: savedCount }),
      icon: "bookmark.fill",
      color: "#E3F2FD",
      route: "/lists/saved",
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
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Spacing.lg }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("profile.title")}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing.xl * 2 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: `${primaryColor}20` },
            ]}
          >
            <IconSymbol name="person.fill" size={40} color={primaryColor} />
          </View>
          <Text style={[styles.greeting, { color: textColor }]}>
            {t("profile.greeting")}
          </Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            {t("profile.keepLearning")}
          </Text>
        </View>

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
            icon={<IconSymbol name="book.fill" size={24} color={primaryColor} />}
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
                    name={item.icon as any}
                    size={22}
                    color={primaryColor}
                  />
                }
                onPress={() => router.push(item.route as any)}
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
                    name={item.icon as any}
                    size={22}
                    color={textSecondary}
                  />
                }
                onPress={() => router.push(item.route as any)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
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
