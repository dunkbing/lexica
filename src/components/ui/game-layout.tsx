import React, {
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
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
import Svg, { Circle } from "react-native-svg";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";
import type { Word } from "@/types";

export interface GameLayoutRef {
  showFeedback: () => void;
  hideFeedback: () => void;
}

export interface WordResult {
  word: Word;
  isCorrect: boolean;
}

interface GameLayoutProps {
  // Progress
  currentIndex: number;
  totalQuestions: number;

  // Results
  showResults: boolean;
  correctCount: number;
  wordResults?: WordResult[];

  // Callbacks
  onPlayAgain: () => void;
  onClose?: () => void;

  // Content
  children: React.ReactNode;

  // Optional bottom sheet content
  feedbackContent?: React.ReactNode;
  isCorrect?: boolean;
  onNext: () => void;
  isLastQuestion?: boolean;
  isAnswered?: boolean;
}

// Circular Progress Ring Component
function CircularProgress({
  correct,
  total,
  size = 160,
  strokeWidth = 12,
  successColor,
  errorColor,
  textColor,
}: {
  correct: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  successColor: string;
  errorColor: string;
  textColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const correctProgress = total > 0 ? correct / total : 0;
  const incorrectProgress = total > 0 ? (total - correct) / total : 0;

  const correctStrokeDashoffset = circumference * (1 - correctProgress);
  const incorrectStrokeDashoffset = circumference * (1 - incorrectProgress);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`${textColor}20`}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Incorrect (red/orange) arc - starts from bottom */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={errorColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={incorrectStrokeDashoffset}
          strokeLinecap="round"
          rotation={90 + correctProgress * 360}
          origin={`${size / 2}, ${size / 2}`}
        />
        {/* Correct (green) arc - starts from top */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={successColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={correctStrokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text
        style={{
          fontSize: FontSizes.xxl,
          fontWeight: FontWeights.bold,
          color: textColor,
        }}
      >
        {correct}/{total}
      </Text>
    </View>
  );
}

// Results List Screen Component
function ResultsListScreen({
  wordResults,
  onBack,
  onFinish,
  isVietnamese,
}: {
  wordResults: WordResult[];
  onBack: () => void;
  onFinish: () => void;
  isVietnamese: boolean;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "borderLight");

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View
        style={[
          styles.resultsListHeader,
          { paddingTop: insets.top + Spacing.md },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={20} color={textColor} />
          <Text style={[styles.backText, { color: textColor }]}>
            {t("common.back")}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.resultsListTitle, { color: textColor }]}>
          {t("practice.yourResults")}
        </Text>

        <TouchableOpacity onPress={onFinish}>
          <Text style={[styles.finishText, { color: primaryColor }]}>
            {t("practice.finish")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.resultsListContent}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: cardBackground, borderColor },
          ]}
        >
          <Text style={[styles.infoText, { color: textSecondary }]}>
            {t("practice.resultsHint")}
          </Text>
        </View>

        {/* Word Results List */}
        {wordResults.map((result, index) => {
          const definition = isVietnamese
            ? result.word.definition.vi
            : result.word.definition.en;

          return (
            <View
              key={`${result.word.id}-${index}`}
              style={[
                styles.wordResultCard,
                { backgroundColor: cardBackground, borderColor },
              ]}
            >
              {/* Word Header Row */}
              <View style={styles.wordResultHeader}>
                <View style={styles.wordResultLeft}>
                  <IconSymbol
                    name={
                      result.isCorrect
                        ? "checkmark.circle.fill"
                        : "xmark.circle.fill"
                    }
                    size={24}
                    color={result.isCorrect ? successColor : errorColor}
                  />
                  <Text style={[styles.wordResultTerm, { color: textColor }]}>
                    {result.word.term}
                  </Text>
                  <TouchableOpacity style={styles.speakerButton}>
                    <IconSymbol
                      name="speaker.wave.2.fill"
                      size={18}
                      color={textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.wordResultActions}>
                  <TouchableOpacity style={styles.actionIcon}>
                    <IconSymbol name="heart" size={22} color={textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIcon}>
                    <IconSymbol
                      name="bookmark"
                      size={22}
                      color={textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Definition */}
              <Text
                style={[styles.wordResultDefinition, { color: textSecondary }]}
              >
                ({result.word.pos}) {definition}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const GameLayout = forwardRef<GameLayoutRef, GameLayoutProps>(
  (
    {
      currentIndex,
      totalQuestions,
      showResults,
      correctCount,
      wordResults = [],
      onPlayAgain,
      onClose,
      children,
      feedbackContent,
      isCorrect = false,
      onNext,
      isLastQuestion = false,
      isAnswered = false,
    },
    ref,
  ) => {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [showDetailedResults, setShowDetailedResults] = useState(false);

    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const textSecondary = useThemeColor({}, "textSecondary");
    const primaryColor = useThemeColor({}, "primary");
    const successColor = useThemeColor({}, "success");
    const errorColor = useThemeColor({}, "error");
    const cardBackground = useThemeColor({}, "cardBackground");
    const borderColor = useThemeColor({}, "borderLight");

    const isVietnamese = i18n.language === "vi";
    const progress =
      totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 0;

    useImperativeHandle(ref, () => ({
      showFeedback: () => bottomSheetRef.current?.expand(),
      hideFeedback: () => bottomSheetRef.current?.close(),
    }));

    const handleClose = useCallback(() => {
      if (onClose) {
        onClose();
      } else {
        router.back();
      }
    }, [onClose, router]);

    const handleNext = useCallback(() => {
      bottomSheetRef.current?.close();
      onNext();
    }, [onNext]);

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      [],
    );

    // Results List Screen
    if (showResults && showDetailedResults) {
      return (
        <ResultsListScreen
          wordResults={wordResults}
          onBack={() => setShowDetailedResults(false)}
          onFinish={handleClose}
          isVietnamese={isVietnamese}
        />
      );
    }

    // Results Summary Screen
    if (showResults) {
      const accuracy = Math.round((correctCount / totalQuestions) * 100);
      const isPerfect = correctCount === totalQuestions;
      const isGood = accuracy >= 70;

      return (
        <View style={[styles.container, { backgroundColor }]}>
          {/* Header with Share */}
          <View
            style={[
              styles.resultsHeader,
              { paddingTop: insets.top + Spacing.md },
            ]}
          >
            <View style={{ width: 60 }} />
            <View style={{ flex: 1 }} />
            <TouchableOpacity>
              <Text style={[styles.shareText, { color: textColor }]}>
                {t("common.share")}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.resultsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={[styles.resultTitle, { color: textColor }]}>
              {isPerfect
                ? t("practice.perfectScore")
                : isGood
                  ? t("practice.greatJob")
                  : t("practice.goodEffort")}
            </Text>

            {/* Circular Progress */}
            <View style={styles.circularProgressContainer}>
              <CircularProgress
                correct={correctCount}
                total={totalQuestions}
                successColor={successColor}
                errorColor={errorColor}
                textColor={textColor}
              />
            </View>

            {/* Encouragement */}
            <Text style={[styles.encouragementTitle, { color: textColor }]}>
              {t("practice.keepItGoing")}
            </Text>
            <Text
              style={[styles.encouragementSubtitle, { color: textSecondary }]}
            >
              {t("practice.practiceStreak", { count: 1, days: 5 })}
            </Text>

            {/* Streak Indicators */}
            <View style={styles.streakIndicators}>
              {[0, 1, 2, 3, 4].map((day) => (
                <View
                  key={day}
                  style={[
                    styles.streakDay,
                    {
                      backgroundColor: day === 4 ? primaryColor : "transparent",
                      borderColor: day === 4 ? primaryColor : borderColor,
                    },
                  ]}
                >
                  {day === 4 && (
                    <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              ))}
            </View>

            {/* Tip Card */}
            <View
              style={[
                styles.tipCard,
                { backgroundColor: cardBackground, borderColor },
              ]}
            >
              <Text style={[styles.tipText, { color: textSecondary }]}>
                {t("practice.retentionTip")}
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View
            style={[
              styles.bottomActions,
              { paddingBottom: insets.bottom + Spacing.xl },
            ]}
          >
            {wordResults.length > 0 && (
              <PrimaryButton
                title={t("practice.seeResults")}
                onPress={() => setShowDetailedResults(true)}
                style={styles.seeResultsButton}
              />
            )}
            <View style={styles.bottomButtonsRow}>
              <PrimaryButton
                title={t("practice.playAgain")}
                onPress={onPlayAgain}
                variant="outlined"
                style={styles.halfButton}
              />
              <PrimaryButton
                title={t("practice.backToHome")}
                onPress={handleClose}
                variant="outlined"
                style={styles.halfButton}
              />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: cardBackground, borderColor },
            ]}
            onPress={handleClose}
          >
            <IconSymbol name="xmark" size={20} color={textColor} />
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <ProgressBar progress={progress} />
          </View>

          <View style={styles.questionCount}>
            <Text style={[styles.questionCountText, { color: textSecondary }]}>
              {currentIndex + 1}/{totalQuestions}
            </Text>
          </View>
        </View>

        {/* Content */}
        {children}

        {/* Next Button (shown when answered and no feedback content) */}
        {isAnswered && !feedbackContent && (
          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + Spacing.xl },
            ]}
          >
            <PrimaryButton
              title={
                isLastQuestion
                  ? t("practice.finish")
                  : t("practice.nextQuestion")
              }
              onPress={onNext}
              style={{ backgroundColor: isCorrect ? successColor : errorColor }}
            />
          </View>
        )}

        {/* Answer Bottom Sheet */}
        {feedbackContent && (
          <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            enablePanDownToClose
            enableDynamicSizing
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: cardBackground }}
            handleIndicatorStyle={{ backgroundColor: textSecondary }}
          >
            <BottomSheetView
              style={[
                styles.sheetContent,
                { paddingBottom: insets.bottom + Spacing.lg },
              ]}
            >
              <View style={styles.feedbackRow}>
                <IconSymbol
                  name={
                    isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill"
                  }
                  size={28}
                  color={isCorrect ? successColor : errorColor}
                />
                <Text
                  style={[
                    styles.feedbackText,
                    { color: isCorrect ? successColor : errorColor },
                  ]}
                >
                  {isCorrect ? t("practice.correct") : t("practice.incorrect")}
                </Text>
              </View>

              {feedbackContent}

              <PrimaryButton
                title={
                  isLastQuestion
                    ? t("practice.finish")
                    : t("practice.nextQuestion")
                }
                onPress={handleNext}
                style={{
                  ...styles.sheetNextButton,
                  backgroundColor: isCorrect ? successColor : errorColor,
                }}
              />
            </BottomSheetView>
          </BottomSheet>
        )}
      </View>
    );
  },
);

GameLayout.displayName = "GameLayout";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  progressContainer: {
    flex: 1,
  },
  questionCount: {
    minWidth: 44,
    alignItems: "flex-end",
  },
  questionCountText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },
  sheetContent: {
    padding: Spacing.xl,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  feedbackText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  sheetNextButton: {
    marginTop: Spacing.lg,
  },

  // Results Summary Screen
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  shareText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  resultsScrollContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  resultTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    textAlign: "center",
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  circularProgressContainer: {
    marginBottom: Spacing.xl * 2,
  },
  encouragementTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  encouragementSubtitle: {
    fontSize: FontSizes.sm,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  streakIndicators: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  streakDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tipCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    width: "100%",
    marginBottom: Spacing.xl,
  },
  tipText: {
    fontSize: FontSizes.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  bottomActions: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  seeResultsButton: {
    width: "100%",
  },
  bottomButtonsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfButton: {
    flex: 1,
  },

  // Results List Screen
  resultsListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  backText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  resultsListTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  finishText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  resultsListContent: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  infoText: {
    fontSize: FontSizes.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  wordResultCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  wordResultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  wordResultLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  wordResultTerm: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  speakerButton: {
    padding: Spacing.xs,
  },
  wordResultActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionIcon: {
    padding: Spacing.xs,
  },
  wordResultDefinition: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginLeft: 32,
  },
});
