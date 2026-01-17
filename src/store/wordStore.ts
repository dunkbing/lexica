import { create } from "zustand";
import type { Word, Category, CategoryGroup } from "@/types";
import * as wordRepository from "@/db/repositories/word-repository";
import * as categoryRepository from "@/db/repositories/category-repository";

interface WordState {
  words: Word[];
  categories: Category[];
  categoryGroups: CategoryGroup[];
  todayWords: Word[];
  currentWordIndex: number;
  isLoading: boolean;
  selectedCategoryId: string | null; // null means all categories

  // Actions
  loadWords: () => Promise<void>;
  setCurrentWordIndex: (index: number) => void;
  nextWord: () => void;
  prevWord: () => void;
  shuffleTodayWords: (count?: number) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  getWordById: (id: string) => Word | undefined;
  getWordsByCategory: (categoryId: string) => Word[];
  getRandomWords: (count: number, excludeIds?: string[]) => Word[];
}

export const useWordStore = create<WordState>((set, get) => ({
  words: [],
  categories: [],
  categoryGroups: [],
  todayWords: [],
  currentWordIndex: 0,
  isLoading: false,
  selectedCategoryId: null,

  loadWords: async () => {
    set({ isLoading: true });

    try {
      // Load from SQLite database
      const [words, categories, categoryGroups] = await Promise.all([
        wordRepository.getAllWords(),
        categoryRepository.getAllCategories(),
        categoryRepository.getAllCategoryGroups(),
      ]);

      const { selectedCategoryId } = get();

      // Filter words by selected category if any
      const filteredWords = selectedCategoryId
        ? words.filter((w) => w.categoryId === selectedCategoryId)
        : words;

      // Shuffle and pick words for today
      const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);
      const todayWords = shuffled.slice(0, Math.min(5, shuffled.length));

      set({
        words,
        categories,
        categoryGroups,
        todayWords,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error loading words from database:", error);
      set({ isLoading: false });
    }
  },

  setCurrentWordIndex: (index) => {
    const { todayWords } = get();
    if (index >= 0 && index < todayWords.length) {
      set({ currentWordIndex: index });
    }
  },

  nextWord: () => {
    const { currentWordIndex, todayWords } = get();
    if (currentWordIndex < todayWords.length - 1) {
      set({ currentWordIndex: currentWordIndex + 1 });
    }
  },

  prevWord: () => {
    const { currentWordIndex } = get();
    if (currentWordIndex > 0) {
      set({ currentWordIndex: currentWordIndex - 1 });
    }
  },

  shuffleTodayWords: (count = 5) => {
    const { words, selectedCategoryId } = get();

    // Filter words by selected category if any
    const filteredWords = selectedCategoryId
      ? words.filter((w) => w.categoryId === selectedCategoryId)
      : words;

    const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);
    set({
      todayWords: shuffled.slice(0, Math.min(count, shuffled.length)),
      currentWordIndex: 0,
    });
  },

  setSelectedCategory: (categoryId) => {
    const { words } = get();

    // Filter words by selected category if any
    const filteredWords = categoryId
      ? words.filter((w) => w.categoryId === categoryId)
      : words;

    // Shuffle and pick words
    const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);

    set({
      selectedCategoryId: categoryId,
      todayWords: shuffled.slice(0, Math.min(5, shuffled.length)),
      currentWordIndex: 0,
    });
  },

  getWordById: (id) => {
    return get().words.find((w) => w.id === id);
  },

  getWordsByCategory: (categoryId) => {
    return get().words.filter((w) => w.categoryId === categoryId);
  },

  getRandomWords: (count, excludeIds = []) => {
    const { words } = get();
    const filtered = words.filter((w) => !excludeIds.includes(w.id));
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },
}));
