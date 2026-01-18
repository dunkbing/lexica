import React, { useState, useCallback, useMemo, useEffect } from "react";
import { debounce } from "lodash";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useWordStore } from "@/store/wordStore";
import { useUserStore } from "@/store/userStore";
import {
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";
import type { Word } from "@/types";

const DEBOUNCE_MS = 300;

export default function DictionaryScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "borderLight");

  const words = useWordStore((s) => s.words);
  const getWordState = useUserStore((s) => s.getWordState);

  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const isVietnamese = i18n.language === "vi";

  const debouncedSetSearchQuery = useMemo(
    () => debounce((query: string) => setSearchQuery(query), DEBOUNCE_MS),
    [],
  );

  useEffect(() => {
    debouncedSetSearchQuery(inputValue);
    return () => debouncedSetSearchQuery.cancel();
  }, [inputValue, debouncedSetSearchQuery]);

  const handleClearSearch = useCallback(() => {
    debouncedSetSearchQuery.cancel();
    setInputValue("");
    setSearchQuery("");
  }, [debouncedSetSearchQuery]);

  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) {
      return words;
    }

    const query = searchQuery.toLowerCase().trim();
    return words.filter((word) => {
      // Search in term
      if (word.term.toLowerCase().includes(query)) return true;
      // Search in definition
      if (word.definition.en.toLowerCase().includes(query)) return true;
      if (word.definition.vi.toLowerCase().includes(query)) return true;
      // Search in synonyms
      if (word.synonyms?.some((s) => s.toLowerCase().includes(query)))
        return true;
      return false;
    });
  }, [words, searchQuery]);

  const handleWordPress = useCallback(
    (wordId: string) => {
      router.push(`/word/${wordId}`);
    },
    [router],
  );

  const renderWordItem = useCallback(
    ({ item }: { item: Word }) => {
      const wordState = getWordState(item.id);
      const definition = isVietnamese ? item.definition.vi : item.definition.en;

      return (
        <TouchableOpacity
          style={[
            styles.wordItem,
            { backgroundColor: cardBackground, borderColor },
          ]}
          onPress={() => handleWordPress(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.wordContent}>
            <View style={styles.wordHeader}>
              <Text style={[styles.wordTerm, { color: textColor }]}>
                {item.term}
              </Text>
              <Text style={[styles.wordPos, { color: primaryColor }]}>
                ({item.pos})
              </Text>
            </View>
            <Text style={[styles.wordPhonetic, { color: textSecondary }]}>
              {item.phonetic}
            </Text>
            <Text
              style={[styles.wordDefinition, { color: textSecondary }]}
              numberOfLines={2}
            >
              {definition}
            </Text>
          </View>
          <View style={styles.wordActions}>
            {wordState?.isFavorite && (
              <IconSymbol name="heart.fill" size={16} color={primaryColor} />
            )}
            {wordState?.isSaved && (
              <IconSymbol name="bookmark.fill" size={16} color={primaryColor} />
            )}
            <IconSymbol name="chevron.right" size={16} color={textSecondary} />
          </View>
        </TouchableOpacity>
      );
    },
    [
      cardBackground,
      borderColor,
      textColor,
      textSecondary,
      primaryColor,
      isVietnamese,
      getWordState,
      handleWordPress,
    ],
  );

  const keyExtractor = useCallback((item: Word) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={[styles.title, { color: textColor }]}>
          {t("dictionary.title")}
        </Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          {t("dictionary.wordCount", { count: words.length })}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: cardBackground, borderColor },
          ]}
        >
          <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder={t("dictionary.searchPlaceholder")}
            placeholderTextColor={textSecondary}
            value={inputValue}
            onChangeText={setInputValue}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {inputValue.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <IconSymbol
                name="xmark.circle.fill"
                size={20}
                color={textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Word List */}
      <FlatList
        data={filteredWords}
        renderItem={renderWordItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol
              name="magnifyingglass"
              size={48}
              color={textSecondary}
            />
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              {t("dictionary.noResults")}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  wordItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  wordContent: {
    flex: 1,
  },
  wordHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  wordTerm: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  wordPos: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  wordPhonetic: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  wordDefinition: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  wordActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginLeft: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 3,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
  },
});
