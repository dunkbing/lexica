import React, { useMemo, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

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

const SCROLL_THRESHOLD = 50;

export default function PracticeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const cardBackground = useThemeColor({}, "cardBackground");

  const categories = useWordStore((s) => s.categories);

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
        Extrapolation.CLAMP
      ),
    };
  });

  const smallTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [SCROLL_THRESHOLD - 20, SCROLL_THRESHOLD],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

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
            {t("practice.title")}
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
            {t("practice.title")}
          </Animated.Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            {t("practice.subtitle")}
          </Text>

          {/* Shuffle Button */}
          <TouchableOpacity
            style={[styles.shuffleButton, { backgroundColor: primaryColor }]}
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
              {categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  title={t(`categories.${category.id}`)}
                  subtitle={t("practice.wordsCount", {
                    count: category.wordCount,
                  })}
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
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

function getCategoryIcon(categoryId: string): string {
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
    marginBottom: Spacing.sm,
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
