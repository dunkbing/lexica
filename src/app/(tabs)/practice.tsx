import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { getCategoryStyle } from "@/constants/category-styles";

export default function PracticeTab() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");

  const categories = useWordStore((s) => s.categories);

  const handleShuffle = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/practice/shuffle");
  };

  const handleGame = (gameType: string) => {
    router.push(`/practice/${gameType}` as never);
  };

  const handleCategory = (categoryId: string) => {
    router.push(`/practice/category/${categoryId}` as never);
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
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            {t("practice.title")}
          </Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            {t("practice.subtitle")}
          </Text>
        </View>

        {/* Shuffle Button */}
        <TouchableOpacity
          style={[styles.shuffleButton, { backgroundColor: primaryColor }]}
          onPress={handleShuffle}
          activeOpacity={0.8}
        >
          <IconSymbol name="shuffle" size={24} color="#FFFFFF" />
          <Text style={styles.shuffleText}>{t("practice.gameShuffle")}</Text>
        </TouchableOpacity>

        {/* Games Section */}
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
                      name={game.icon as never}
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
            {categories.map((category) => {
              const style = getCategoryStyle(category.id);
              return (
                <CategoryRow
                  key={category.id}
                  title={
                    i18n.language === "vi" ? category.name_vi : category.name_en
                  }
                  subtitle={t("practice.wordsCount", {
                    count: category.wordCount,
                  })}
                  icon={
                    <IconSymbol
                      name={style.icon as never}
                      size={22}
                      color={style.color}
                    />
                  }
                  onPress={() => handleCategory(category.id)}
                  color={`${style.color}20`}
                />
              );
            })}
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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
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
