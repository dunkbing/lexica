import React, { useState, useEffect, useCallback, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { GameLayout, GameLayoutRef, WordResult } from "@/components/ui/game-layout";
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
const OPTIONS_COUNT = 4;

interface Question {
  word: Word;
  options: string[];
  correctIndex: number;
}

export default function GuessWordScreen() {
  const { t, i18n } = useTranslation();
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const gameLayoutRef = useRef<GameLayoutRef>(null);

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
  const [wordResults, setWordResults] = useState<WordResult[]>([]);

  const isVietnamese = i18n.language === "vi";

  const generateQuestions = useCallback(() => {
    if (words.length < OPTIONS_COUNT) return;

    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(
      0,
      Math.min(QUESTIONS_COUNT, shuffledWords.length),
    );

    const generatedQuestions: Question[] = selectedWords.map((word) => {
      const otherWords = words.filter((w) => w.id !== word.id);
      const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
      const wrongOptions = shuffledOthers
        .slice(0, OPTIONS_COUNT - 1)
        .map((w) => w.term);

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

  useEffect(() => {
    generateQuestions();
  }, [generateQuestions, words]);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedIndex === currentQuestion?.correctIndex;
  const isLastQuestion = currentIndex >= questions.length - 1;

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

      setWordResults((prev) => [
        ...prev,
        { word: currentQuestion.word, isCorrect: correct },
      ]);

      gameLayoutRef.current?.showFeedback();
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
    if (index === selectedIndex) return errorColor;
    return textSecondary;
  };

  const definition = currentQuestion
    ? isVietnamese
      ? currentQuestion.word.definition.vi
      : currentQuestion.word.definition.en
    : "";

  const renderFeedbackContent = () => {
    if (!currentQuestion) return null;

    return (
      <>
        <Text style={[styles.answerWord, { color: textColor }]}>
          {currentQuestion.word.term}
        </Text>
        <Text style={[styles.answerPhonetic, { color: textSecondary }]}>
          {currentQuestion.word.phonetic}
        </Text>
        <Text style={[styles.answerDefinition, { color: textSecondary }]}>
          ({currentQuestion.word.pos}) {definition}
        </Text>
      </>
    );
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
      feedbackContent={renderFeedbackContent()}
    >
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
            ({currentQuestion?.word.pos})
          </Text>
          <Text style={[styles.definition, { color: textColor }]}>
            {definition}
          </Text>
        </View>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion?.options.map((option, index) => (
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
});
