import React, { useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Pill } from "@/components/ui/pill";
import { PrimaryButton } from "@/components/ui/primary-button";
import { IconButton } from "@/components/ui/icon-button";
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

export default function WordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "borderLight");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");

  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const soundEnabled = useAppStore((s) => s.soundEnabled);

  const word = useWordStore((s) => s.getWordById(id || ""));
  const getWordState = useUserStore((s) => s.getWordState);
  const toggleFavorite = useUserStore((s) => s.toggleFavorite);
  const toggleSaved = useUserStore((s) => s.toggleSaved);

  const wordState = word ? getWordState(word.id) : null;

  const speak = useCallback(() => {
    if (!word || !soundEnabled) return;
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Speech.speak(word.term, {
      language: "en-US",
      rate: 0.8,
    });
  }, [word, soundEnabled, hapticsEnabled]);

  const handleFavorite = useCallback(() => {
    if (word) {
      toggleFavorite(word.id);
    }
  }, [word, toggleFavorite]);

  const handleSave = useCallback(() => {
    if (word) {
      toggleSaved(word.id);
    }
  }, [word, toggleSaved]);

  if (!word) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: textSecondary }]}>
            {t("word.notFound")}
          </Text>
        </View>
      </View>
    );
  }

  const posLabel = t(`word.${word.pos}`) || `(${word.pos})`;
  const masteryLevel = wordState?.familiarityScore || 0;
  const masteryPercent = Math.min(100, Math.round((masteryLevel / 6) * 100));

  const isVietnamese = i18n.language === "vi";
  const definition = isVietnamese ? word.definition.vi : word.definition.en;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: cardBackground, borderColor },
          ]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={20} color={textColor} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <IconButton
            icon={
              <IconSymbol
                name={wordState?.isFavorite ? "heart.fill" : "heart"}
                size={22}
                color={wordState?.isFavorite ? "#E57373" : textSecondary}
              />
            }
            onPress={handleFavorite}
            variant="outlined"
          />
          <IconButton
            icon={
              <IconSymbol
                name={wordState?.isSaved ? "bookmark.fill" : "bookmark"}
                size={22}
                color={wordState?.isSaved ? primaryColor : textSecondary}
              />
            }
            onPress={handleSave}
            variant="outlined"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Word */}
        <View style={styles.wordSection}>
          <Text style={[styles.word, { color: textColor }]}>{word.term}</Text>

          <TouchableOpacity onPress={speak} activeOpacity={0.7}>
            <Pill
              text={word.phonetic}
              icon={
                <IconSymbol
                  name="speaker.wave.2.fill"
                  size={16}
                  color={textSecondary}
                />
              }
            />
          </TouchableOpacity>
        </View>

        {/* Mastery */}
        <View
          style={[
            styles.masteryCard,
            { backgroundColor: cardBackground, borderColor },
          ]}
        >
          <View style={styles.masteryHeader}>
            <Text style={[styles.masteryLabel, { color: textSecondary }]}>
              {t("word.mastery")}
            </Text>
            <Text style={[styles.masteryPercent, { color: primaryColor }]}>
              {masteryPercent}%
            </Text>
          </View>
          <View style={[styles.masteryBar, { backgroundColor: borderColor }]}>
            <View
              style={[
                styles.masteryFill,
                { backgroundColor: primaryColor, width: `${masteryPercent}%` },
              ]}
            />
          </View>
        </View>

        {/* Definition */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textSecondary }]}>
            {t("word.definition")}
          </Text>
          <Text style={[styles.definition, { color: textColor }]}>
            {posLabel} {definition}
          </Text>
        </View>

        {/* Examples */}
        {word.examples.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textSecondary }]}>
              {t("word.examples")}
            </Text>
            {word.examples.map((example, index) => (
              <View
                key={index}
                style={[
                  styles.exampleCard,
                  { backgroundColor: cardBackground, borderColor },
                ]}
              >
                {isVietnamese ? (
                  <Text style={[styles.exampleVi, { color: textSecondary }]}>
                    {example.vi}
                  </Text>
                ) : (
                  <Text style={[styles.exampleEn, { color: textColor }]}>
                    &quot;{example.en}&quot;
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Synonyms */}
        {word.synonyms && word.synonyms.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textSecondary }]}>
              {t("word.synonyms")}
            </Text>
            <View style={styles.tagsContainer}>
              {word.synonyms.map((synonym, index) => (
                <View
                  key={index}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: `${successColor}20`,
                      borderColor: successColor,
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: successColor }]}>
                    {synonym}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Antonyms */}
        {word.antonyms && word.antonyms.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textSecondary }]}>
              {t("word.antonyms")}
            </Text>
            <View style={styles.tagsContainer}>
              {word.antonyms.map((antonym, index) => (
                <View
                  key={index}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: `${warningColor}20`,
                      borderColor: warningColor,
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: warningColor }]}>
                    {antonym}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Origin */}
        {word.origin && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textSecondary }]}>
              {t("word.origin")}
            </Text>
            <Text style={[styles.origin, { color: textColor }]}>
              {word.origin}
            </Text>
          </View>
        )}

        {/* Practice Button */}
        <PrimaryButton
          title={t("word.practice")}
          onPress={() => router.push(`/practice/word/${word.id}`)}
          icon={<IconSymbol name="sparkles" size={20} color="#FFFFFF" />}
          style={styles.practiceButton}
        />
      </ScrollView>
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  wordSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  word: {
    fontSize: FontSizes.display,
    fontWeight: FontWeights.bold,
    fontFamily: "Georgia",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  masteryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  masteryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  masteryLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  masteryPercent: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  masteryBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  masteryFill: {
    height: "100%",
    borderRadius: 4,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  definition: {
    fontSize: FontSizes.lg,
    lineHeight: 26,
    marginBottom: Spacing.sm,
  },
  meaning: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  exampleCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  exampleEn: {
    fontSize: FontSizes.md,
    fontStyle: "italic",
    marginBottom: Spacing.xs,
  },
  exampleVi: {
    fontSize: FontSizes.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  origin: {
    fontSize: FontSizes.md,
    fontStyle: "italic",
    lineHeight: 24,
  },
  practiceButton: {
    marginTop: Spacing.lg,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: FontSizes.md,
  },
});
