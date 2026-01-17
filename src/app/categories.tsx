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

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "borderLight");

  const categories = useWordStore((s) => s.categories);
  const words = useWordStore((s) => s.words);
  const loadWords = useWordStore((s) => s.loadWords);
  const wordStates = useUserStore((s) => s.wordStates);

  useEffect(() => {
    if (words.length === 0) {
      loadWords();
    }
  }, [words.length, loadWords]);

  const favoriteCount = useMemo(() => {
    return Object.values(wordStates).filter((ws) => ws.isFavorite).length;
  }, [wordStates]);

  const snapPoints = useMemo(() => ["95%"], []);
  const scrollY = useSharedValue(0);
  const SCROLL_THRESHOLD = 50;

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

  const quickLinks = [
    {
      id: "all",
      title: t("categories.allWords"),
      icon: "text.book.closed.fill",
      count: words.length,
    },
    {
      id: "favorites",
      title: t("categories.favorites"),
      icon: "heart.fill",
      count: favoriteCount,
    },
    {
      id: "own",
      title: t("categories.yourWords"),
      icon: "pencil",
      count: 0,
    },
    {
      id: "collections",
      title: t("categories.collections"),
      icon: "folder.fill",
      count: 0,
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
          onScroll={(e) => {
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
            <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
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
                style={[styles.quickLinkItem, { backgroundColor: cardBackground }]}
                onPress={() => router.push(`/lists/${link.id}` as never)}
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

          {/* Categories Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t("categories.aboutOurselves")}
            </Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: cardBackground },
                  ]}
                  onPress={() => router.push(`/category/${category.id}` as never)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryIconContainer}>
                    <IconSymbol
                      name={getCategoryIcon(category.id)}
                      size={48}
                      color={primaryColor}
                    />
                  </View>
                  <Text style={[styles.categoryTitle, { color: textColor }]}>
                    {t(`categories.${category.id}`)}
                  </Text>
                </TouchableOpacity>
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
      return "face.smiling";
    case "daily_life":
      return "house.fill";
    case "office":
      return "briefcase.fill";
    case "society":
      return "person.3.fill";
    case "human_body":
      return "figure.stand";
    default:
      return "folder.fill";
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
    width: "48%",
    flexGrow: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    justifyContent: "space-between",
  },
  categoryIconContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
});
