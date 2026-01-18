import React, { useState, useEffect, useCallback, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import {
  GameLayout,
  GameLayoutRef,
  WordResult,
} from "@/components/ui/game-layout";
import { IconSymbol } from "@/components/ui/icon-symbol";
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
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const gameLayoutRef = useRef<GameLayoutRef>(null);

  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
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
  const [wordResults, setWordResults] = useState<WordResult[]>([]);

  const isVietnamese = i18n.language === "vi";

  const generateQuestions = useCallback(() => {
    if (words.length === 0) return;

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

      return { word, options, correctIndex };
    });

    setQuestions(generatedQuestions);
  }, [words, isVietnamese]);

  useEffect(() => {
    generateQuestions();
  }, [generateQuestions]);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedIndex === currentQuestion?.correctIndex;
  const isLastQuestion = currentIndex >= questions.length - 1;

  const handleSelectAnswer = useCallback(
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
        setStreak((s) => s + 1);
        recordCorrectAnswer(currentQuestion.word.id);
      } else {
        setStreak(0);
        recordIncorrectAnswer(currentQuestion.word.id);
      }

      setWordResults((prev) => [
        ...prev,
        { word: currentQuestion.word, isCorrect: correct },
      ]);
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
    if (isLastQuestion) {
      incrementPracticeCount();
      setShowResults(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setIsAnswered(false);
    }
  }, [isLastQuestion, incrementPracticeCount]);

  const handlePlayAgain = useCallback(() => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setShowResults(false);
    setStreak(0);
    setWordResults([]);
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
    if (index === selectedIndex && index !== currentQuestion?.correctIndex) {
      return errorColor;
    }
    return textSecondary;
  };

  if (!currentQuestion && !showResults) {
    return (
      <GameLayout
        ref={gameLayoutRef}
        currentIndex={0}
        totalQuestions={QUESTIONS_COUNT}
        showResults={false}
        correctCount={0}
        onPlayAgain={handlePlayAgain}
        onNext={handleNext}
        isCorrect={false}
        isLastQuestion={false}
        isAnswered={false}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textSecondary }]}>
            {t("common.loading")}
          </Text>
        </View>
      </GameLayout>
    );
  }

  return (
    <GameLayout
      ref={gameLayoutRef}
      currentIndex={currentIndex}
      totalQuestions={questions.length}
      showResults={showResults}
      correctCount={correctCount}
      wordResults={wordResults}
      onPlayAgain={handlePlayAgain}
      onNext={handleNext}
      isCorrect={isCorrect}
      isLastQuestion={isLastQuestion}
      isAnswered={isAnswered}
    >
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
          {currentQuestion?.word.term}
        </Text>
        <Text style={[styles.phonetic, { color: textSecondary }]}>
          {currentQuestion?.word.phonetic}
        </Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion?.options.map((option, index) => (
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
    </GameLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: FontSizes.md,
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
});
