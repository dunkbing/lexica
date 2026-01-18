import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

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
import type { Word } from "@/types";

const QUESTIONS_COUNT = 10;

interface Question {
  word: Word;
  options: string[];
  correctIndex: number;
}

export default function MeaningMatchScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "borderLight");

  const words = useWordStore((s) => s.words);
  const recordCorrectAnswer = useUserStore((s) => s.recordCorrectAnswer);
  const recordIncorrectAnswer = useUserStore((s) => s.recordIncorrectAnswer);
  const incrementPracticeCount = useUserStore((s) => s.incrementPracticeCount);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [streak, setStreak] = useState(0);

  const isVietnamese = i18n.language === "vi";

  // Generate questions on mount
  useEffect(() => {
    if (words.length === 0) return;

    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, QUESTIONS_COUNT);

    const generatedQuestions: Question[] = selectedWords.map((word) => {
      // Get 3 wrong answers
      const otherWords = words.filter((w) => w.id !== word.id);
      const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
      const wrongAnswers = shuffledOthers
        .slice(0, 3)
        .map((w) => (isVietnamese ? w.definition.vi : w.definition.en));

      // Create options array with correct answer at random position
      const correctAnswer = isVietnamese
        ? word.definition.vi
        : word.definition.en;
      const correctIndex = Math.floor(Math.random() * 4);
      const options = [...wrongAnswers];
      options.splice(correctIndex, 0, correctAnswer);

      return {
        word,
        options,
        correctIndex,
      };
    });

    setQuestions(generatedQuestions);
  }, [words, isVietnamese]);

  const currentQuestion = questions[currentIndex];
  const progress =
    questions.length > 0 ? (currentIndex + 1) / questions.length : 0;

  const handleSelectAnswer = useCallback(
    (index: number) => {
      if (isAnswered || !currentQuestion) return;

      setSelectedIndex(index);
      setIsAnswered(true);

      const isCorrect = index === currentQuestion.correctIndex;

      if (hapticsEnabled) {
        if (isCorrect) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }

      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        setStreak((s) => s + 1);
        recordCorrectAnswer(currentQuestion.word.id);
      } else {
        setStreak(0);
        recordIncorrectAnswer(currentQuestion.word.id);
      }
    },
    [
      isAnswered,
      currentQuestion,
      hapticsEnabled,
      recordCorrectAnswer,
      recordIncorrectAnswer,
    ],
  );

  const handleNext = useCallback(() => {
    if (currentIndex >= questions.length - 1) {
      incrementPracticeCount();
      setShowResults(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setIsAnswered(false);
    }
  }, [currentIndex, questions.length, incrementPracticeCount]);

  const handlePlayAgain = useCallback(() => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setShowResults(false);
    setStreak(0);

    // Regenerate questions
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, QUESTIONS_COUNT);

    const generatedQuestions: Question[] = selectedWords.map((word) => {
      const otherWords = words.filter((w) => w.id !== word.id);
      const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
      const wrongAnswers = shuffledOthers
        .slice(0, 3)
        .map((w) => (isVietnamese ? w.definition.vi : w.definition.en));

      const correctAnswer = isVietnamese
        ? word.definition.vi
        : word.definition.en;
      const correctIndex = Math.floor(Math.random() * 4);
      const options = [...wrongAnswers];
      options.splice(correctIndex, 0, correctAnswer);

      return {
        word,
        options,
        correctIndex,
      };
    });

    setQuestions(generatedQuestions);
  }, [words, isVietnamese]);

  const getOptionStyle = (index: number) => {
    if (!isAnswered) {
      return { backgroundColor: cardBackground, borderColor };
    }

    if (index === currentQuestion?.correctIndex) {
      return {
        backgroundColor: `${successColor}20`,
        borderColor: successColor,
      };
    }

    if (index === selectedIndex && index !== currentQuestion?.correctIndex) {
      return { backgroundColor: `${errorColor}20`, borderColor: errorColor };
    }

    return { backgroundColor: cardBackground, borderColor };
  };

  const getOptionTextColor = (index: number) => {
    if (!isAnswered) return textColor;

    if (index === currentQuestion?.correctIndex) {
      return successColor;
    }

    if (index === selectedIndex && index !== currentQuestion?.correctIndex) {
      return errorColor;
    }

    return textSecondary;
  };

  if (showResults) {
    const accuracy = Math.round((correctCount / questions.length) * 100);
    const isPerfect = correctCount === questions.length;
    const isGood = accuracy >= 70;

    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.resultsContainer}>
          <View
            style={[
              styles.resultIcon,
              {
                backgroundColor: isPerfect
                  ? `${successColor}20`
                  : `${primaryColor}20`,
              },
            ]}
          >
            <IconSymbol
              name={
                isPerfect
                  ? "star.fill"
                  : isGood
                    ? "checkmark.circle.fill"
                    : "arrow.clockwise"
              }
              size={64}
              color={isPerfect ? successColor : primaryColor}
            />
          </View>

          <Text style={[styles.resultTitle, { color: textColor }]}>
            {isPerfect
              ? t("practice.perfectScore")
              : isGood
                ? t("practice.greatJob")
                : t("practice.keepPracticing")}
          </Text>

          <View style={styles.resultStats}>
            <View
              style={[
                styles.resultStat,
                { backgroundColor: cardBackground, borderColor },
              ]}
            >
              <Text style={[styles.resultStatValue, { color: successColor }]}>
                {correctCount}
              </Text>
              <Text style={[styles.resultStatLabel, { color: textSecondary }]}>
                {t("practice.correct")}
              </Text>
            </View>
            <View
              style={[
                styles.resultStat,
                { backgroundColor: cardBackground, borderColor },
              ]}
            >
              <Text style={[styles.resultStatValue, { color: errorColor }]}>
                {questions.length - correctCount}
              </Text>
              <Text style={[styles.resultStatLabel, { color: textSecondary }]}>
                {t("practice.incorrect")}
              </Text>
            </View>
            <View
              style={[
                styles.resultStat,
                { backgroundColor: cardBackground, borderColor },
              ]}
            >
              <Text style={[styles.resultStatValue, { color: primaryColor }]}>
                {accuracy}%
              </Text>
              <Text style={[styles.resultStatLabel, { color: textSecondary }]}>
                {t("practice.accuracy")}
              </Text>
            </View>
          </View>

          <View style={styles.resultActions}>
            <PrimaryButton
              title={t("practice.playAgain")}
              onPress={handlePlayAgain}
              style={styles.actionButton}
            />
            <PrimaryButton
              title={t("practice.backToHome")}
              onPress={() => router.back()}
              variant="outlined"
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textSecondary }]}>
            {t("common.loading")}
          </Text>
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
          onPress={() => router.back()}
        >
          <IconSymbol name="xmark" size={20} color={textColor} />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} />
        </View>

        <View style={styles.questionCount}>
          <Text style={[styles.questionCountText, { color: textSecondary }]}>
            {currentIndex + 1}/{questions.length}
          </Text>
        </View>
      </View>

      {/* Streak indicator */}
      {streak > 1 && (
        <View
          style={[styles.streakBadge, { backgroundColor: `${successColor}20` }]}
        >
          <IconSymbol name="flame.fill" size={16} color={successColor} />
          <Text style={[styles.streakText, { color: successColor }]}>
            {t("game.streak", { count: streak })}
          </Text>
        </View>
      )}

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={[styles.instruction, { color: textSecondary }]}>
          {t("game.whatMeans")}
        </Text>
        <Text style={[styles.word, { color: textColor }]}>
          {currentQuestion.word.term}
        </Text>
        <Text style={[styles.phonetic, { color: textSecondary }]}>
          {currentQuestion.word.phonetic}
        </Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, getOptionStyle(index)]}
            onPress={() => handleSelectAnswer(index)}
            disabled={isAnswered}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.optionText, { color: getOptionTextColor(index) }]}
              numberOfLines={2}
            >
              {option}
            </Text>
            {isAnswered && index === currentQuestion.correctIndex && (
              <IconSymbol
                name="checkmark.circle.fill"
                size={24}
                color={successColor}
              />
            )}
            {isAnswered &&
              index === selectedIndex &&
              index !== currentQuestion.correctIndex && (
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color={errorColor}
                />
              )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Button */}
      {isAnswered && (
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}
        >
          <PrimaryButton
            title={
              currentIndex >= questions.length - 1
                ? t("practice.finish")
                : t("practice.nextQuestion")
            }
            onPress={handleNext}
          />
        </View>
      )}
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
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  streakText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  questionContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  instruction: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
  },
  word: {
    fontSize: FontSizes.display,
    fontWeight: FontWeights.bold,
    fontFamily: "Georgia",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  phonetic: {
    fontSize: FontSizes.md,
  },
  optionsContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  optionText: {
    flex: 1,
    fontSize: FontSizes.md,
    marginRight: Spacing.md,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: FontSizes.md,
  },
  resultsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  resultIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  resultTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  resultStats: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl * 2,
  },
  resultStat: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    minWidth: 90,
  },
  resultStatValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  resultStatLabel: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  resultActions: {
    width: "100%",
    gap: Spacing.md,
  },
  actionButton: {
    width: "100%",
  },
});
