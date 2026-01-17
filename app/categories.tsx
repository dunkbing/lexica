import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { PracticeTile } from "@/components/ui/practice-tile";
import { CategoryRow } from "@/components/ui/category-row";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useWordStore } from "@/store/wordStore";
import { useUserStore } from "@/store/userStore";
import {
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "borderLight");

  const categories = useWordStore((s) => s.categories);
  const words = useWordStore((s) => s.words);
  const wordStates = useUserStore((s) => s.wordStates);

  const favoriteCount = useMemo(() => {
    return Object.values(wordStates).filter((ws) => ws.isFavorite).length;
  }, [wordStates]);

  const quickLinks = [
    {
      id: "all",
      title: t("categories.allWords"),
      icon: "square.grid.2x2.fill",
      count: words.length,
    },
    {
      id: "favorites",
      title: t("categories.favorites"),
      icon: "heart.fill",
      count: favoriteCount,
    },
    {
      id: "collections",
      title: t("categories.collections"),
      icon: "folder.fill",
      count: 0,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Spacing.lg }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("categories.title")}
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
        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: cardBackground, borderColor }]}>
          <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder={t("common.search")}
            placeholderTextColor={textSecondary}
          />
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinksGrid}>
          {quickLinks.map((link) => (
            <View key={link.id} style={styles.quickLinkItem}>
              <PracticeTile
                title={link.title}
                icon={
                  <IconSymbol
                    name={link.icon as any}
                    size={28}
                    color={primaryColor}
                  />
                }
                onPress={() => router.push(`/lists/${link.id}` as any)}
              />
            </View>
          ))}
        </View>

        {/* Make Your Mix */}
        <TouchableOpacity
          style={[styles.mixButton, { backgroundColor: cardBackground, borderColor }]}
          activeOpacity={0.7}
        >
          <View style={[styles.mixIcon, { backgroundColor: `${primaryColor}15` }]}>
            <IconSymbol name="plus" size={24} color={primaryColor} />
          </View>
          <View style={styles.mixContent}>
            <Text style={[styles.mixTitle, { color: textColor }]}>
              {t("categories.makeYourMix")}
            </Text>
            <Text style={[styles.mixSubtitle, { color: textSecondary }]}>
              {t("categories.yourWords")}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={textSecondary} />
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t("practice.categories")}
          </Text>
          <View style={styles.categoriesList}>
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                title={t(`categories.${category.id}`)}
                subtitle={t("practice.wordsCount", { count: category.wordCount })}
                icon={
                  <IconSymbol
                    name={getCategoryIcon(category.id)}
                    size={22}
                    color={primaryColor}
                  />
                }
                onPress={() => router.push(`/category/${category.id}` as any)}
                color={getCategoryColor(category.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function getCategoryIcon(categoryId: string): any {
  switch (categoryId) {
    case "emotions":
      return "heart.fill";
    case "daily_life":
      return "house.fill";
    case "office":
      return "briefcase.fill";
    case "society":
      return "person.3.fill";
    default:
      return "folder.fill";
  }
}

function getCategoryColor(categoryId: string): string {
  switch (categoryId) {
    case "emotions":
      return "#FCE4EC";
    case "daily_life":
      return "#E8F5E9";
    case "office":
      return "#E3F2FD";
    case "society":
      return "#FFF3E0";
    default:
      return "#F5F5F5";
  }
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    padding: 0,
  },
  quickLinksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickLinkItem: {
    width: "31%",
    flexGrow: 1,
  },
  mixButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  mixIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  mixContent: {
    flex: 1,
  },
  mixTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  mixSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.md,
  },
  categoriesList: {
    gap: Spacing.md,
  },
});
