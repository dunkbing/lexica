import React, { useMemo, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
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
import { StatTile } from "@/components/ui/stat-tile";
import { Card } from "@/components/ui/card";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useUserStore } from "@/store/userStore";
import { useWordStore } from "@/store/wordStore";
import {
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";

const SCROLL_THRESHOLD = 50;

export default function StatsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "borderLight");

  const stats = useUserStore((s) => s.stats);
  const wordStates = useUserStore((s) => s.wordStates);
  const totalWords = useWordStore((s) => s.words.length);

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

  // Calculate learning stats
  const masteredWords = Object.values(wordStates).filter(
    (ws) => ws.familiarityScore >= 5
  ).length;
  const learningWords = Object.values(wordStates).filter(
    (ws) => ws.familiarityScore > 0 && ws.familiarityScore < 5
  ).length;
  const newWords = Math.max(0, totalWords - masteredWords - learningWords);

  // Calculate accuracy
  const totalCorrect = Object.values(wordStates).reduce(
    (sum, ws) => sum + ws.correctCount,
    0
  );
  const totalAttempts = Object.values(wordStates).reduce(
    (sum, ws) => sum + ws.correctCount + ws.incorrectCount,
    0
  );
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const weekDays = [t("stats.sun"), t("stats.mon"), t("stats.tue"), t("stats.wed"), t("stats.thu"), t("stats.fri"), t("stats.sat")];
  const today = new Date().getDay();
  const reorderedDays = [...weekDays.slice(today + 1), ...weekDays.slice(0, today + 1)];
  const reorderedActivity = [
    ...stats.weeklyActivity.slice(today + 1),
    ...stats.weeklyActivity.slice(0, today + 1),
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
            {t("stats.title")}
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
            {t("stats.title")}
          </Animated.Text>

          {/* Streak */}
          <Card variant="elevated" style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <IconSymbol name="flame.fill" size={40} color="#FF9800" />
              <View style={styles.streakInfo}>
                <Text style={[styles.streakValue, { color: textColor }]}>
                  {stats.currentStreak}
                </Text>
                <Text style={[styles.streakLabel, { color: textSecondary }]}>
                  {t("stats.dayStreak")}
                </Text>
              </View>
            </View>
            <Text style={[styles.longestStreak, { color: textSecondary }]}>
              {t("stats.longestStreak", { count: stats.longestStreak })}
            </Text>
          </Card>

          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <StatTile
              value={stats.totalRead}
              label={t("stats.wordsLearned")}
              icon={<IconSymbol name="book.fill" size={24} color={primaryColor} />}
              style={styles.statTile}
            />
            <StatTile
              value={stats.totalPractices}
              label={t("stats.practicesDone")}
              icon={<IconSymbol name="gamecontroller.fill" size={24} color={primaryColor} />}
              style={styles.statTile}
            />
            <StatTile
              value={`${accuracy}%`}
              label={t("stats.accuracy")}
              icon={<IconSymbol name="target" size={24} color={successColor} />}
              style={styles.statTile}
            />
            <StatTile
              value={stats.totalFavorited}
              label={t("stats.favorites")}
              icon={<IconSymbol name="heart.fill" size={24} color="#E57373" />}
              style={styles.statTile}
            />
          </View>

          {/* Weekly Activity */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t("stats.weeklyActivity")}
            </Text>
            <Card variant="outlined" style={styles.activityCard}>
              <View style={styles.weekGrid}>
                {reorderedDays.map((day, index) => (
                  <View key={day} style={styles.dayColumn}>
                    <View
                      style={[
                        styles.dayDot,
                        {
                          backgroundColor: reorderedActivity[index]
                            ? primaryColor
                            : borderColor,
                        },
                      ]}
                    >
                      {reorderedActivity[index] && (
                        <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.dayLabel,
                        {
                          color: reorderedActivity[index] ? textColor : textSecondary,
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>

          {/* Learning Progress */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t("stats.learningProgress")}
            </Text>
            <Card variant="outlined" style={styles.progressCard}>
              <View style={styles.progressRow}>
                <View style={styles.progressItem}>
                  <View style={[styles.progressDot, { backgroundColor: successColor }]} />
                  <Text style={[styles.progressLabel, { color: textSecondary }]}>
                    {t("stats.mastered")}
                  </Text>
                  <Text style={[styles.progressValue, { color: textColor }]}>
                    {masteredWords}
                  </Text>
                </View>
                <View style={styles.progressItem}>
                  <View style={[styles.progressDot, { backgroundColor: warningColor }]} />
                  <Text style={[styles.progressLabel, { color: textSecondary }]}>
                    {t("stats.learning")}
                  </Text>
                  <Text style={[styles.progressValue, { color: textColor }]}>
                    {learningWords}
                  </Text>
                </View>
                <View style={styles.progressItem}>
                  <View style={[styles.progressDot, { backgroundColor: borderColor }]} />
                  <Text style={[styles.progressLabel, { color: textSecondary }]}>
                    {t("stats.new")}
                  </Text>
                  <Text style={[styles.progressValue, { color: textColor }]}>
                    {newWords}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              {totalWords > 0 && (
                <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
                  <View
                    style={[
                      styles.progressSegment,
                      {
                        backgroundColor: successColor,
                        width: `${(masteredWords / totalWords) * 100}%`,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.progressSegment,
                      {
                        backgroundColor: warningColor,
                        width: `${(learningWords / totalWords) * 100}%`,
                      },
                    ]}
                  />
                </View>
              )}
            </Card>
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
  streakCard: {
    marginBottom: Spacing.xl,
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: FontSizes.display,
    fontWeight: FontWeights.bold,
  },
  streakLabel: {
    fontSize: FontSizes.md,
  },
  longestStreak: {
    fontSize: FontSizes.sm,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statTile: {
    width: "48%",
    flexGrow: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.md,
  },
  activityCard: {
    padding: Spacing.lg,
  },
  weekGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayColumn: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  progressCard: {
    padding: Spacing.lg,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.lg,
  },
  progressItem: {
    alignItems: "center",
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  progressValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: "row",
    overflow: "hidden",
  },
  progressSegment: {
    height: "100%",
  },
});
