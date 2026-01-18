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

type QuestionType = "meaning-match" | "fill-gap" | "guess-word" | "synonyms";

interface BaseQuestion {
  type: QuestionType;
  word: Word;
  options: string[];
  correctIndex: number;
  instruction: string;
}

interface MeaningMatchQuestion extends BaseQuestion {
  type: "meaning-match";
}

interface FillGapQuestion extends BaseQuestion {
  type: "fill-gap";
  sentence: string;
  blankSentence: string;
}

interface GuessWordQuestion extends BaseQuestion {
  type: "guess-word";
  definition: string;
}

interface SynonymsQuestion extends BaseQuestion {
  type: "synonyms";
  correctSynonym: string;
}

type ShuffleQuestion =
  | MeaningMatchQuestion
  | FillGapQuestion
  | GuessWordQuestion
  | SynonymsQuestion;

export default function ShuffleScreen() {
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

  const [questions, setQuestions] = useState<ShuffleQuestion[]>([]);
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

    // Filter words with examples and synonyms for specific question types
    const wordsWithExamples = words.filter(
      (w) => w.examples && w.examples.length > 0,
    );
    const wordsWithSynonyms = words.filter(
      (w) => w.synonyms && w.synonyms.length > 0,
    );
    const allSynonyms = wordsWithSynonyms.flatMap((w) => w.synonyms || []);

    const questionTypes: QuestionType[] = [
      "meaning-match",
      "fill-gap",
      "guess-word",
      "synonyms",
    ];

    const generatedQuestions: ShuffleQuestion[] = selectedWords.map(
      (word, index) => {
        // Pick a random question type, but ensure it's valid for this word
        let availableTypes = [...questionTypes];

        // Only allow fill-gap if word has examples
        if (!word.examples || word.examples.length === 0) {
          availableTypes = availableTypes.filter((t) => t !== "fill-gap");
        }

        // Only allow synonyms if word has synonyms
        if (!word.synonyms || word.synonyms.length === 0) {
          availableTypes = availableTypes.filter((t) => t !== "synonyms");
        }

        // Default to meaning-match if no valid types
        if (availableTypes.length === 0) {
          availableTypes = ["meaning-match"];
        }

        // Rotate through available types for variety
        const type = availableTypes[index % availableTypes.length];

        switch (type) {
          case "meaning-match":
            return generateMeaningMatchQuestion(word);
          case "fill-gap":
            return generateFillGapQuestion(word, wordsWithExamples);
          case "guess-word":
            return generateGuessWordQuestion(word);
          case "synonyms":
            return generateSynonymsQuestion(word, allSynonyms);
          default:
            return generateMeaningMatchQuestion(word);
        }
      },
    );

    setQuestions(generatedQuestions);
  }, [words, isVietnamese]);

  const generateMeaningMatchQuestion = (word: Word): MeaningMatchQuestion => {
    const otherWords = words.filter((w) => w.id !== word.id);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
    const wrongAnswers = shuffledOthers
      .slice(0, OPTIONS_COUNT - 1)
      .map((w) => (isVietnamese ? w.definition.vi : w.definition.en));

    const correctAnswer = isVietnamese
      ? word.definition.vi
      : word.definition.en;
    const correctIndex = Math.floor(Math.random() * OPTIONS_COUNT);
    const options = [...wrongAnswers];
    options.splice(correctIndex, 0, correctAnswer);

    return {
      type: "meaning-match",
      word,
      options,
      correctIndex,
      instruction: t("game.whatMeans"),
    };
  };

  const generateFillGapQuestion = (
    word: Word,
    wordsWithExamples: Word[],
  ): FillGapQuestion => {
    const example = word.examples![0];
    const sentence = example.en;
    const regex = new RegExp(`\\b${word.term}\\b`, "gi");
    const blankSentence = sentence.replace(regex, "_____");

    const otherWords = wordsWithExamples.filter((w) => w.id !== word.id);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
    const wrongOptions = shuffledOthers
      .slice(0, OPTIONS_COUNT - 1)
      .map((w) => w.term);

    const correctIndex = Math.floor(Math.random() * OPTIONS_COUNT);
    const options = [...wrongOptions];
    options.splice(correctIndex, 0, word.term);

    return {
      type: "fill-gap",
      word,
      sentence,
      blankSentence,
      options,
      correctIndex,
      instruction: t("game.fillSentence"),
    };
  };

  const generateGuessWordQuestion = (word: Word): GuessWordQuestion => {
    const otherWords = words.filter((w) => w.id !== word.id);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
    const wrongOptions = shuffledOthers
      .slice(0, OPTIONS_COUNT - 1)
      .map((w) => w.term);

    const correctIndex = Math.floor(Math.random() * OPTIONS_COUNT);
    const options = [...wrongOptions];
    options.splice(correctIndex, 0, word.term);

    const definition = isVietnamese ? word.definition.vi : word.definition.en;

    return {
      type: "guess-word",
      word,
      definition,
      options,
      correctIndex,
      instruction: t("game.whichWord"),
    };
  };

  const generateSynonymsQuestion = (
    word: Word,
    allSynonyms: string[],
  ): SynonymsQuestion => {
    const correctSynonym =
      word.synonyms![Math.floor(Math.random() * word.synonyms!.length)];

    const otherSynonyms = allSynonyms.filter(
      (s) => !word.synonyms!.includes(s),
    );
    const shuffledOthers = [...new Set(otherSynonyms)].sort(
      () => Math.random() - 0.5,
    );
    const wrongOptions = shuffledOthers.slice(0, OPTIONS_COUNT - 1);

    const correctIndex = Math.floor(Math.random() * OPTIONS_COUNT);
    const options = [...wrongOptions];
    options.splice(correctIndex, 0, correctSynonym);

    return {
      type: "synonyms",
      word,
      correctSynonym,
      options,
      correctIndex,
      instruction: t("game.findSynonym"),
    };
  };

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

  const definition = currentQuestion
    ? isVietnamese
      ? currentQuestion.word.definition.vi
      : currentQuestion.word.definition.en
    : "";

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case "meaning-match":
        return (
          <View style={styles.questionContainer}>
            <Text style={[styles.instruction, { color: textSecondary }]}>
              {currentQuestion.instruction}
            </Text>
            <Text style={[styles.mainWord, { color: textColor }]}>
              {currentQuestion.word.term}
            </Text>
            <Text style={[styles.phonetic, { color: textSecondary }]}>
              {currentQuestion.word.phonetic}
            </Text>
          </View>
        );

      case "fill-gap":
        return (
          <View style={styles.questionContainer}>
            <Text style={[styles.instruction, { color: textSecondary }]}>
              {currentQuestion.instruction}
            </Text>
            <View
              style={[
                styles.sentenceCard,
                { backgroundColor: cardBackground, borderColor },
              ]}
            >
              <Text style={[styles.sentence, { color: textColor }]}>
                {currentQuestion.blankSentence}
              </Text>
            </View>
          </View>
        );

      case "guess-word":
        return (
          <View style={styles.questionContainer}>
            <Text style={[styles.instruction, { color: textSecondary }]}>
              {currentQuestion.instruction}
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
                {currentQuestion.definition}
              </Text>
            </View>
          </View>
        );

      case "synonyms":
        return (
          <View style={styles.questionContainer}>
            <Text style={[styles.instruction, { color: textSecondary }]}>
              {currentQuestion.instruction}
            </Text>
            <View
              style={[
                styles.wordCard,
                { backgroundColor: cardBackground, borderColor },
              ]}
            >
              <Text style={[styles.mainWord, { color: textColor }]}>
                {currentQuestion.word.term}
              </Text>
              <Text style={[styles.phonetic, { color: textSecondary }]}>
                {currentQuestion.word.phonetic}
              </Text>
            </View>
          </View>
        );
    }
  };

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
        {currentQuestion.type === "synonyms" &&
          currentQuestion.word.synonyms && (
            <View style={styles.synonymsRow}>
              <Text style={[styles.synonymsLabel, { color: textSecondary }]}>
                {t("word.synonyms")}:
              </Text>
              <Text style={[styles.synonymsList, { color: primaryColor }]}>
                {currentQuestion.word.synonyms.join(", ")}
              </Text>
            </View>
          )}
        <Text style={[styles.answerDefinition, { color: textSecondary }]}>
          ({currentQuestion.word.pos}) {definition}
        </Text>
      </>
    );
  };

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
      {renderQuestionContent()}

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
              numberOfLines={2}
            >
              {option}
            </Text>
            {isAnswered && index === currentQuestion?.correctIndex && (
              <IconSymbol
                name="checkmark.circle.fill"
                size={24}
                color={successColor}
              />
            )}
            {isAnswered &&
              index === selectedIndex &&
              index !== currentQuestion?.correctIndex && (
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
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  instruction: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  mainWord: {
    fontSize: FontSizes.display,
    fontWeight: FontWeights.bold,
    fontFamily: "Georgia",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  phonetic: {
    fontSize: FontSizes.md,
  },
  sentenceCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    width: "100%",
  },
  sentence: {
    fontSize: FontSizes.lg,
    lineHeight: 28,
    textAlign: "center",
  },
  definitionCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    width: "100%",
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
  wordCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    width: "100%",
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
    flex: 1,
    fontSize: FontSizes.md,
    marginRight: Spacing.md,
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
  synonymsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  synonymsLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  synonymsList: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  answerDefinition: {
    fontSize: FontSizes.md,
  },
});
