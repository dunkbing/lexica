import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { PracticeTile } from "@/components/ui/practice-tile";
import { CategoryRow } from "@/components/ui/category-row";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useWordStore } from "@/store/wordStore";
import { useAppStore } from "@/store";
import {
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";

export default function PracticeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "borderLight");

  const categories = useWordStore((s) => s.categories);

  const handleShuffle = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/practice/shuffle");
  };

  const handleGame = (gameType: string) => {
    router.push(`/practice/${gameType}` as any);
  };

  const handleCategory = (categoryId: string) => {
    router.push(`/practice/category/${categoryId}` as any);
  };

  const games = [
    {
      id: "guess-word",
      title: t("practice.guessWord"),
      icon: "questionmark.circle.fill",
      color: "#E8F5E9",
    },
    {
      id: "meaning-match",
      title: t("practice.meaningMatch"),
      icon: "arrow.left.arrow.right",
      color: "#E3F2FD",
    },
    {
      id: "fill-gap",
      title: t("practice.fillGap"),
      icon: "text.cursor",
      color: "#FFF3E0",
    },
    {
      id: "synonyms",
      title: t("practice.matchSynonyms"),
      icon: "link",
      color: "#FCE4EC",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Spacing.lg }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("practice.title")}
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
        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          {t("practice.subtitle")}
        </Text>

        {/* Shuffle Button */}
        <TouchableOpacity
          style={[
            styles.shuffleButton,
            { backgroundColor: primaryColor },
          ]}
          onPress={handleShuffle}
          activeOpacity={0.8}
        >
          <IconSymbol name="shuffle" size={24} color="#FFFFFF" />
          <Text style={styles.shuffleText}>{t("practice.gameShuffle")}</Text>
        </TouchableOpacity>

        {/* Challenge Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t("practice.challenges")}
          </Text>
          <View style={styles.gamesGrid}>
            {games.map((game) => (
              <View key={game.id} style={styles.gameItem}>
                <PracticeTile
                  title={game.title}
                  icon={
                    <IconSymbol
                      name={game.icon as any}
                      size={28}
                      color={primaryColor}
                    />
                  }
                  onPress={() => handleGame(game.id)}
                  color={game.color}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Categories Section */}
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
                onPress={() => handleCategory(category.id)}
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
  subtitle: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.xl,
  },
  shuffleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
  },
  shuffleText: {
    color: "#FFFFFF",
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.md,
  },
  gamesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  gameItem: {
    width: "48%",
    flexGrow: 1,
  },
  categoriesList: {
    gap: Spacing.md,
  },
});
