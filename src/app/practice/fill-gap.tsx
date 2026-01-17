import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
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
  sentence: string;
  blankSentence: string;
}

export default function FillGapScreen() {
  const { t } = useTranslation();
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
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Generate questions on mount
  useEffect(() => {
    if (words.length === 0) return;

    // Filter words that have examples
    const wordsWithExamples = words.filter(
      (w) => w.examples && w.examples.length > 0
    );

    const shuffledWords = [...wordsWithExamples].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, QUESTIONS_COUNT);

    const generatedQuestions: Question[] = selectedWords.map((word) => {
      const example = word.examples[0];
      const sentence = example.en;

      // Create blank version - replace the word with underscores
      const regex = new RegExp(`\\b${word.term}\\b`, "gi");
      const blankSentence = sentence.replace(regex, "_____");

      return {
        word,
        sentence,
        blankSentence,
      };
    });

    setQuestions(generatedQuestions);
  }, [words]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;

  const handleSubmit = useCallback(() => {
    if (!currentQuestion || !userAnswer.trim()) return;

    setIsAnswered(true);

    const normalizedAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrect = currentQuestion.word.term.toLowerCase();
    const correct = normalizedAnswer === normalizedCorrect;

    setIsCorrect(correct);

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
  }, [currentQuestion, userAnswer, hapticsEnabled, recordCorrectAnswer, recordIncorrectAnswer]);

  const handleNext = useCallback(() => {
    if (currentIndex >= questions.length - 1) {
      incrementPracticeCount();
      setShowResults(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setUserAnswer("");
      setIsAnswered(false);
      setIsCorrect(false);
    }
  }, [currentIndex, questions.length, incrementPracticeCount]);

  const handlePlayAgain = useCallback(() => {
    setCurrentIndex(0);
    setUserAnswer("");
    setIsAnswered(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setShowResults(false);

    // Regenerate questions
    const wordsWithExamples = words.filter(
      (w) => w.examples && w.examples.length > 0
    );

    const shuffledWords = [...wordsWithExamples].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, QUESTIONS_COUNT);

    const generatedQuestions: Question[] = selectedWords.map((word) => {
      const example = word.examples[0];
      const sentence = example.en;
      const regex = new RegExp(`\\b${word.term}\\b`, "gi");
      const blankSentence = sentence.replace(regex, "_____");

      return {
        word,
        sentence,
        blankSentence,
      };
    });

    setQuestions(generatedQuestions);
  }, [words]);

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
              { backgroundColor: isPerfect ? `${successColor}20` : `${primaryColor}20` },
            ]}
          >
            <IconSymbol
              name={isPerfect ? "star.fill" : isGood ? "checkmark.circle.fill" : "arrow.clockwise"}
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
            <View style={[styles.resultStat, { backgroundColor: cardBackground, borderColor }]}>
              <Text style={[styles.resultStatValue, { color: successColor }]}>
                {correctCount}
              </Text>
              <Text style={[styles.resultStatLabel, { color: textSecondary }]}>
                {t("practice.correct")}
              </Text>
            </View>
            <View style={[styles.resultStat, { backgroundColor: cardBackground, borderColor }]}>
              <Text style={[styles.resultStatValue, { color: errorColor }]}>
                {questions.length - correctCount}
              </Text>
              <Text style={[styles.resultStatLabel, { color: textSecondary }]}>
                {t("practice.incorrect")}
              </Text>
            </View>
            <View style={[styles.resultStat, { backgroundColor: cardBackground, borderColor }]}>
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: cardBackground, borderColor }]}
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
          {t("game.fillSentence")}
        </Text>

        <View style={[styles.sentenceCard, { backgroundColor: cardBackground, borderColor }]}>
          <Text style={[styles.sentence, { color: textColor }]}>
            "{currentQuestion.blankSentence}"
          </Text>
          <Text style={[styles.translation, { color: textSecondary }]}>
            {currentQuestion.word.examples[0].vi}
          </Text>
        </View>

        {/* Hint */}
        <View style={styles.hintContainer}>
          <Text style={[styles.hintLabel, { color: textSecondary }]}>
            {currentQuestion.word.phonetic}
          </Text>
          <Text style={[styles.hintMeaning, { color: primaryColor }]}>
            {currentQuestion.word.meaning_vi}
          </Text>
        </View>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: cardBackground,
              borderColor: isAnswered
                ? isCorrect
                  ? successColor
                  : errorColor
                : borderColor,
              color: textColor,
            },
          ]}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder={t("practice.fillBlank")}
          placeholderTextColor={textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isAnswered}
          onSubmitEditing={handleSubmit}
        />

        {isAnswered && (
          <View style={styles.feedbackContainer}>
            {isCorrect ? (
              <View style={styles.feedbackRow}>
                <IconSymbol name="checkmark.circle.fill" size={24} color={successColor} />
                <Text style={[styles.feedbackText, { color: successColor }]}>
                  {t("practice.correct")}!
                </Text>
              </View>
            ) : (
              <View>
                <View style={styles.feedbackRow}>
                  <IconSymbol name="xmark.circle.fill" size={24} color={errorColor} />
                  <Text style={[styles.feedbackText, { color: errorColor }]}>
                    {t("practice.incorrect")}
                  </Text>
                </View>
                <Text style={[styles.correctAnswer, { color: textColor }]}>
                  {t("practice.correct")}: {currentQuestion.word.term}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Submit/Next Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {isAnswered ? (
          <PrimaryButton
            title={
              currentIndex >= questions.length - 1
                ? t("practice.finish")
                : t("practice.nextQuestion")
            }
            onPress={handleNext}
          />
        ) : (
          <PrimaryButton
            title={t("common.confirm")}
            onPress={handleSubmit}
            disabled={!userAnswer.trim()}
          />
        )}
      </View>
    </KeyboardAvoidingView>
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
  sentenceCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  sentence: {
    fontSize: FontSizes.lg,
    lineHeight: 28,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  translation: {
    fontSize: FontSizes.md,
    textAlign: "center",
    fontStyle: "italic",
  },
  hintContainer: {
    alignItems: "center",
  },
  hintLabel: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  hintMeaning: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  inputContainer: {
    paddingHorizontal: Spacing.xl,
    flex: 1,
  },
  input: {
    fontSize: FontSizes.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    textAlign: "center",
  },
  feedbackContainer: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  feedbackText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  correctAnswer: {
    fontSize: FontSizes.md,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  footer: {
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
