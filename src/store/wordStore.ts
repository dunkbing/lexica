import { create } from "zustand";
import type { Word, Category } from "@/types";
import wordsData from "@/assets/data/words.json";

interface WordState {
  words: Word[];
  categories: Category[];
  todayWords: Word[];
  currentWordIndex: number;
  isLoading: boolean;

  // Actions
  loadWords: () => void;
  setCurrentWordIndex: (index: number) => void;
  nextWord: () => void;
  prevWord: () => void;
  shuffleTodayWords: (count: number) => void;
  getWordById: (id: string) => Word | undefined;
  getWordsByCategory: (categoryId: string) => Word[];
  getRandomWords: (count: number, excludeIds?: string[]) => Word[];
}

export const useWordStore = create<WordState>((set, get) => ({
  words: [],
  categories: [],
  todayWords: [],
  currentWordIndex: 0,
  isLoading: false,

  loadWords: () => {
    set({ isLoading: true });
    const words = wordsData.words as Word[];
    const categories = wordsData.categories as Category[];

    // Shuffle and pick words for today
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const todayWords = shuffled.slice(0, 5);

    set({
      words,
      categories,
      todayWords,
      isLoading: false,
    });
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

  shuffleTodayWords: (count) => {
    const { words } = get();
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    set({
      todayWords: shuffled.slice(0, count),
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
