import React, { useMemo, useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
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
import { useThemeColor } from "@/hooks/use-theme-color";
import { useWordStore } from "@/store/wordStore";
import { useUserStore } from "@/store/userStore";
import {
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";
import { getCategoryStyle } from "@/constants/category-styles";
import type { Category, CategoryGroup } from "@/types";

export default function CategoriesScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "borderLight");

  const categories = useWordStore((s) => s.categories);
  const categoryGroups = useWordStore((s) => s.categoryGroups);
  console.log({ categoryGroups });
  const words = useWordStore((s) => s.words);
  const loadWords = useWordStore((s) => s.loadWords);
  const setSelectedCategory = useWordStore((s) => s.setSelectedCategory);
  const selectedCategoryId = useWordStore((s) => s.selectedCategoryId);
  const wordStates = useUserStore((s) => s.wordStates);

  useEffect(() => {
    if (words.length === 0) {
      loadWords();
    }
  }, [words.length, loadWords]);

  const favoriteCount = useMemo(() => {
    return Object.values(wordStates).filter((ws) => ws.isFavorite).length;
  }, [wordStates]);

  // Group categories by their groupId
  const groupedCategories = useMemo(() => {
    const grouped = new Map<
      string,
      { group: CategoryGroup; categories: Category[] }
    >();

    for (const group of categoryGroups) {
      const groupCategories = categories.filter((c) => c.groupId === group.id);
      if (groupCategories.length > 0) {
        grouped.set(group.id, { group, categories: groupCategories });
      }
    }

    return grouped;
  }, [categories, categoryGroups]);

  const snapPoints = useMemo(() => ["95%"], []);
  const scrollY = useSharedValue(0);
  const SCROLL_THRESHOLD = 50;

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId);
      router.back();
    },
    [setSelectedCategory, router],
  );

  const handleAllWordsSelect = useCallback(() => {
    setSelectedCategory(null);
    router.back();
  }, [setSelectedCategory, router]);

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

  const quickLinks = [
    {
      id: "all",
      title: t("categories.allWords"),
      icon: "text.book.closed.fill",
      count: words.length,
      onPress: handleAllWordsSelect,
    },
    {
      id: "favorites",
      title: t("categories.favorites"),
      icon: "heart.fill",
      count: favoriteCount,
      onPress: () => router.push("/lists/favorites" as never),
    },
    {
      id: "own",
      title: t("categories.yourWords"),
      icon: "pencil",
      count: 0,
      onPress: () => router.push("/lists/own" as never),
    },
    {
      id: "collections",
      title: t("categories.collections"),
      icon: "folder.fill",
      count: 0,
      onPress: () => router.push("/lists/collections" as never),
    },
  ];

  const getCategoryName = (category: Category) => {
    return i18n.language === "vi" ? category.name_vi : category.name_en;
  };

  const getGroupName = (group: CategoryGroup) => {
    return i18n.language === "vi" ? group.name_vi : group.name_en;
  };

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
            {t("categories.title")}
          </Animated.Text>

          <View style={styles.headerSpacer} />
        </View>

        <BottomSheetScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Spacing.xl * 2 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={(e: { nativeEvent: { contentOffset: { y: number } } }) => {
            scrollY.value = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {/* Large Title */}
          <Animated.Text
            style={[styles.largeTitle, { color: textColor }, largeTitleStyle]}
          >
            {t("categories.title")}
          </Animated.Text>

          {/* Search */}
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: cardBackground, borderColor },
            ]}
          >
            <IconSymbol
              name="magnifyingglass"
              size={20}
              color={textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder={t("categories.searchTopics")}
              placeholderTextColor={textSecondary}
            />
          </View>

          {/* Make Your Mix */}
          <TouchableOpacity
            style={[styles.mixButton, { backgroundColor: primaryColor }]}
            activeOpacity={0.8}
          >
            <Text style={styles.mixButtonText}>
              {t("categories.makeYourMix")}
            </Text>
          </TouchableOpacity>

          {/* Quick Links Grid */}
          <View style={styles.quickLinksGrid}>
            {quickLinks.map((link) => (
              <TouchableOpacity
                key={link.id}
                style={[
                  styles.quickLinkItem,
                  { backgroundColor: cardBackground },
                  link.id === "all" &&
                    selectedCategoryId === null && {
                      borderWidth: 2,
                      borderColor: primaryColor,
                    },
                ]}
                onPress={link.onPress}
                activeOpacity={0.7}
              >
                <IconSymbol
                  name={link.icon as never}
                  size={28}
                  color={primaryColor}
                />
                <Text
                  style={[styles.quickLinkText, { color: textColor }]}
                  numberOfLines={2}
                >
                  {link.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category Groups */}
          {Array.from(groupedCategories.values()).map(
            ({ group, categories: groupCats }) => (
              <View key={group.id} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  {getGroupName(group)}
                </Text>
                <View style={styles.categoriesGrid}>
                  {groupCats.map((category) => {
                    const style = getCategoryStyle(category.id);
                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryCard,
                          { backgroundColor: cardBackground },
                          selectedCategoryId === category.id && {
                            borderWidth: 2,
                            borderColor: primaryColor,
                          },
                        ]}
                        onPress={() => handleCategorySelect(category.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.categoryIconContainer,
                            { backgroundColor: style.color + "20" },
                          ]}
                        >
                          <IconSymbol
                            name={style.icon as never}
                            size={32}
                            color={style.color}
                          />
                        </View>
                        <Text
                          style={[styles.categoryTitle, { color: textColor }]}
                          numberOfLines={2}
                        >
                          {getCategoryName(category)}
                        </Text>
                        <Text
                          style={[styles.wordCount, { color: textSecondary }]}
                        >
                          {category.wordCount} {t("categories.words")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ),
          )}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    padding: 0,
  },
  mixButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
  },
  mixButtonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  quickLinksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickLinkItem: {
    width: "48%",
    flexGrow: 1,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  quickLinkText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.lg,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  categoryCard: {
    width: "31%",
    flexGrow: 1,
    minWidth: 100,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  categoryTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    textAlign: "center",
  },
  wordCount: {
    fontSize: FontSizes.xs,
  },
});
