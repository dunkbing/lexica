import React, { useState, useEffect, useCallback, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";

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
const OPTIONS_COUNT = 4;

interface Question {
  word: Word;
  options: string[];
  correctIndex: number;
}

export default function GuessWordScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const bottomSheetRef = useRef<BottomSheet>(null);

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

  const isVietnamese = i18n.language === "vi";

  const generateQuestions = useCallback(() => {
    if (words.length < OPTIONS_COUNT) return;

    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(
      0,
      Math.min(QUESTIONS_COUNT, shuffledWords.length),
    );

    const generatedQuestions: Question[] = selectedWords.map((word) => {
      // Get wrong options from other words
      const otherWords = words.filter((w) => w.id !== word.id);
      const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
      const wrongOptions = shuffledOthers
        .slice(0, OPTIONS_COUNT - 1)
        .map((w) => w.term);

      // Insert correct answer at random position
      const correctIndex = Math.floor(Math.random() * OPTIONS_COUNT);
      const options = [...wrongOptions];
      options.splice(correctIndex, 0, word.term);

      return {
        word,
        options,
        correctIndex,
      };
    });

    setQuestions(generatedQuestions);
  }, [words]);

  // Generate questions on mount
  useEffect(() => {
    generateQuestions();
  }, [generateQuestions, words]);

  const currentQuestion = questions[currentIndex];
  const progress =
    questions.length > 0 ? (currentIndex + 1) / questions.length : 0;
  const isCorrect = selectedIndex === currentQuestion?.correctIndex;

  const handleSelectOption = useCallback(
    (index: number) => {
      if (isAnswered || !currentQuestion) return;

      setSelectedIndex(index);
      setIsAnswered(true);

      const correct = index === currentQuestion.correctIndex;

      if (hapticsEnabled) {
        if (correct) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }

      if (correct) {
        setCorrectCount((c) => c + 1);
        recordCorrectAnswer(currentQuestion.word.id);
      } else {
        recordIncorrectAnswer(currentQuestion.word.id);
      }

      // Show bottom sheet with answer
      bottomSheetRef.current?.expand();
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
    bottomSheetRef.current?.close();
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
    generateQuestions();
  }, [generateQuestions]);

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
    if (index === currentQuestion?.correctIndex) return successColor;
    if (index === selectedIndex) return errorColor;
    return textSecondary;
  };

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

  // Get definition in current language
  const definition = isVietnamese
    ? currentQuestion.word.definition.vi
    : currentQuestion.word.definition.en;

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

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={[styles.instruction, { color: textSecondary }]}>
          {t("game.whichWord")}
        </Text>

        <View
          style={[
            styles.definitionCard,
            { backgroundColor: cardBackground, borderColor },
          ]}
        >
          <Text style={[styles.posLabel, { color: primaryColor }]}>
            ({currentQuestion.word.pos})
          </Text>
          <Text style={[styles.definition, { color: textColor }]}>
            {definition}
          </Text>
        </View>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.optionButton, getOptionStyle(index)]}
            onPress={() => handleSelectOption(index)}
            disabled={isAnswered}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.optionText, { color: getOptionTextColor(index) }]}
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
            style={{ backgroundColor: isCorrect ? successColor : errorColor }}
          />
        </View>
      )}

      {/* Answer Bottom Sheet */}
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
              name={isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill"}
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

          <Text style={[styles.answerWord, { color: textColor }]}>
            {currentQuestion.word.term}
          </Text>
          <Text style={[styles.answerPhonetic, { color: textSecondary }]}>
            {currentQuestion.word.phonetic}
          </Text>
          <Text style={[styles.answerDefinition, { color: textSecondary }]}>
            ({currentQuestion.word.pos}) {definition}
          </Text>

          <PrimaryButton
            title={
              currentIndex >= questions.length - 1
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
  questionContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  instruction: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  definitionCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  posLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.sm,
  },
  definition: {
    fontSize: FontSizes.lg,
    lineHeight: 28,
    textAlign: "center",
  },
  optionsContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  optionText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
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
  answerWord: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  answerPhonetic: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  answerDefinition: {
    fontSize: FontSizes.md,
  },
  sheetNextButton: {
    marginTop: Spacing.lg,
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
