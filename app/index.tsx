import React, { useEffect, useCallback, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WordCard } from "@/components/word-card";
import { BottomNav } from "@/components/bottom-nav";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useWordStore } from "@/store/wordStore";
import { useUserStore } from "@/store/userStore";
import { useAppStore } from "@/store";
import {
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "borderLight");

  const {
    todayWords,
    currentWordIndex,
    loadWords,
    nextWord,
    shuffleTodayWords,
  } = useWordStore();
  const {
    getWordState,
    toggleFavorite,
    toggleSaved,
    swipeRight,
    swipeLeft,
    markWordSeen,
    stats,
  } = useUserStore();
  const dailyGoal = useAppStore((s) => s.dailyGoal);

  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const currentWord = todayWords[currentWordIndex];
  const wordState = currentWord ? getWordState(currentWord.id) : null;
  const progress = todayWords.length > 0 ? (currentWordIndex + 1) / todayWords.length : 0;

  const handleSwipeRight = useCallback(() => {
    if (currentWord) {
      swipeRight(currentWord.id);
      markWordSeen(currentWord.id);

      if (currentWordIndex >= todayWords.length - 1) {
        setShowComplete(true);
      } else {
        nextWord();
      }
    }
  }, [
    currentWord,
    currentWordIndex,
    todayWords.length,
    swipeRight,
    markWordSeen,
    nextWord,
  ]);

  const handleSwipeLeft = useCallback(() => {
    if (currentWord) {
      swipeLeft(currentWord.id);
      markWordSeen(currentWord.id);

      if (currentWordIndex >= todayWords.length - 1) {
        setShowComplete(true);
      } else {
        nextWord();
      }
    }
  }, [
    currentWord,
    currentWordIndex,
    todayWords.length,
    swipeLeft,
    markWordSeen,
    nextWord,
  ]);

  const handleInfoPress = useCallback(() => {
    if (currentWord) {
      router.push(`/word/${currentWord.id}`);
    }
  }, [currentWord, router]);

  const handleFavoritePress = useCallback(() => {
    if (currentWord) {
      toggleFavorite(currentWord.id);
    }
  }, [currentWord, toggleFavorite]);

  const handleSavePress = useCallback(() => {
    if (currentWord) {
      toggleSaved(currentWord.id);
    }
  }, [currentWord, toggleSaved]);

  const handleSharePress = useCallback(() => {
    // TODO: Implement share functionality
  }, []);

  const handleNewSession = useCallback(() => {
    shuffleTodayWords(dailyGoal);
    setShowComplete(false);
  }, [shuffleTodayWords, dailyGoal]);

  if (showComplete) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.completeContainer}>
          <View
            style={[
              styles.completeIcon,
              { backgroundColor: `${primaryColor}20` },
            ]}
          >
            <IconSymbol name="checkmark.circle.fill" size={64} color={primaryColor} />
          </View>
          <Text style={[styles.completeTitle, { color: textColor }]}>
            {t("home.sessionComplete")}
          </Text>
          <Text style={[styles.completeSubtitle, { color: textSecondary }]}>
            {t("home.sessionCompleteDesc", { count: todayWords.length })}
          </Text>

          <View style={styles.completeStats}>
            <View style={[styles.statBox, { backgroundColor: cardBackground, borderColor }]}>
              <Text style={[styles.statValue, { color: primaryColor }]}>
                {stats.currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: textSecondary }]}>
                {t("stats.streak")}
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: cardBackground, borderColor }]}>
              <Text style={[styles.statValue, { color: primaryColor }]}>
                {stats.totalRead}
              </Text>
              <Text style={[styles.statLabel, { color: textSecondary }]}>
                {t("stats.wordsLearned")}
              </Text>
            </View>
          </View>

          <View style={styles.completeActions}>
            <PrimaryButton
              title={t("home.newSession")}
              onPress={handleNewSession}
              style={styles.actionButton}
            />
            <PrimaryButton
              title={t("home.practice")}
              onPress={() => router.push("/practice")}
              variant="outlined"
              style={styles.actionButton}
            />
          </View>
        </View>
        <BottomNav />
      </View>
    );
  }

  if (!currentWord) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textSecondary }]}>
            {t("common.loading")}
          </Text>
        </View>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: cardBackground, borderColor }]}
          onPress={() => router.push("/profile")}
        >
          <IconSymbol name="person" size={22} color={textColor} />
        </TouchableOpacity>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <IconSymbol name="bookmark" size={18} color={textColor} />
            <Text style={[styles.progressText, { color: textColor }]}>
              {currentWordIndex + 1}/{todayWords.length}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <ProgressBar progress={progress} height={4} />
          </View>
        </View>
      </View>

      {/* Card Container */}
      <View style={styles.cardContainer}>
        <WordCard
          word={currentWord}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
          onInfoPress={handleInfoPress}
          onFavoritePress={handleFavoritePress}
          onSavePress={handleSavePress}
          onSharePress={handleSharePress}
          isFavorite={wordState?.isFavorite ?? false}
          isSaved={wordState?.isSaved ?? false}
        />
      </View>

      {/* Bottom Navigation */}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  progressSection: {
    flex: 1,
    paddingTop: Spacing.xs,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  progressText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  progressBarContainer: {
    width: "70%",
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: FontSizes.md,
  },
  completeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  completeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  completeTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  completeSubtitle: {
    fontSize: FontSizes.md,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  completeStats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.xl * 2,
  },
  statBox: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    minWidth: 120,
  },
  statValue: {
    fontSize: FontSizes.display,
    fontWeight: FontWeights.bold,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  completeActions: {
    width: "100%",
    gap: Spacing.md,
  },
  actionButton: {
    width: "100%",
  },
});
