import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserWordState, UserStats, Collection, GameResult } from "@/types";

// SRS intervals in milliseconds
const SRS_INTERVALS_MS = [1, 3, 7, 14, 30, 60, 120].map(
  (d) => d * 24 * 60 * 60 * 1000,
);

const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const getWeeklyActivity = (
  lastActiveDate: string | null,
  currentActivity: boolean[],
): boolean[] => {
  const today = getTodayDateString();

  if (!lastActiveDate) {
    return [true, false, false, false, false, false, false];
  }

  const lastDate = new Date(lastActiveDate);
  const todayDate = new Date(today);
  const diffDays = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 0) {
    // Same day, mark today as active
    const newActivity = [...currentActivity];
    newActivity[0] = true;
    return newActivity;
  } else if (diffDays < 7) {
    // Shift the activity array
    const newActivity = Array(7).fill(false);
    for (let i = diffDays; i < 7; i++) {
      newActivity[i] = currentActivity[i - diffDays] || false;
    }
    newActivity[0] = true;
    return newActivity;
  } else {
    // More than a week, reset
    return [true, false, false, false, false, false, false];
  }
};

interface UserState {
  wordStates: Record<string, UserWordState>;
  stats: UserStats;
  collections: Collection[];
  history: string[]; // word IDs in order of viewing
  gameResults: GameResult[];

  // Actions
  getWordState: (wordId: string) => UserWordState;
  markWordSeen: (wordId: string) => void;
  toggleFavorite: (wordId: string) => void;
  recordCorrectAnswer: (wordId: string) => void;
  recordIncorrectAnswer: (wordId: string) => void;
  swipeRight: (wordId: string) => void; // Know the word
  swipeLeft: (wordId: string) => void; // Need to review
  addToCollection: (wordId: string, collectionId: string) => void;
  removeFromCollection: (wordId: string, collectionId: string) => void;
  createCollection: (name: string) => string;
  deleteCollection: (collectionId: string) => void;
  getWordsToReview: () => string[];
  getFavoriteWordIds: () => string[];
  getSavedWordIds: () => string[];
  addGameResult: (result: GameResult) => void;
  incrementPracticeCount: () => void;
  updateStreak: () => void;
}

const defaultWordState = (wordId: string): UserWordState => ({
  wordId,
  familiarityScore: 0,
  lastSeenAt: null,
  nextReviewAt: null,
  isFavorite: false,
  isSaved: false,
  collections: [],
  correctCount: 0,
  incorrectCount: 0,
});

const defaultStats: UserStats = {
  totalRead: 0,
  totalFavorited: 0,
  totalSaved: 0,
  totalPractices: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  weeklyActivity: [false, false, false, false, false, false, false],
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      wordStates: {},
      stats: defaultStats,
      collections: [],
      history: [],
      gameResults: [],

      getWordState: (wordId) => {
        const state = get().wordStates[wordId];
        return state || defaultWordState(wordId);
      },

      markWordSeen: (wordId) => {
        const now = Date.now();
        const currentState = get().getWordState(wordId);
        const { history, stats } = get();

        // Add to history if not already the last item
        const newHistory =
          history[history.length - 1] === wordId
            ? history
            : [...history.slice(-99), wordId];

        set((state) => ({
          wordStates: {
            ...state.wordStates,
            [wordId]: {
              ...currentState,
              lastSeenAt: now,
            },
          },
          history: newHistory,
          stats: {
            ...stats,
            totalRead: stats.totalRead + 1,
          },
        }));

        // Update streak
        get().updateStreak();
      },

      toggleFavorite: (wordId) => {
        const currentState = get().getWordState(wordId);
        const newIsFavorite = !currentState.isFavorite;
        const { stats } = get();

        set((state) => ({
          wordStates: {
            ...state.wordStates,
            [wordId]: {
              ...currentState,
              isFavorite: newIsFavorite,
            },
          },
          stats: {
            ...stats,
            totalFavorited: newIsFavorite
              ? stats.totalFavorited + 1
              : Math.max(0, stats.totalFavorited - 1),
          },
        }));
      },

      recordCorrectAnswer: (wordId) => {
        const currentState = get().getWordState(wordId);
        const now = Date.now();
        const newScore = Math.min(6, currentState.familiarityScore + 1);
        const intervalIndex = Math.min(newScore, SRS_INTERVALS_MS.length - 1);
        const nextReview = now + SRS_INTERVALS_MS[intervalIndex];

        set((state) => ({
          wordStates: {
            ...state.wordStates,
            [wordId]: {
              ...currentState,
              familiarityScore: newScore,
              correctCount: currentState.correctCount + 1,
              lastSeenAt: now,
              nextReviewAt: nextReview,
            },
          },
        }));
      },

      recordIncorrectAnswer: (wordId) => {
        const currentState = get().getWordState(wordId);
        const now = Date.now();
        const newScore = Math.max(0, currentState.familiarityScore - 1);
        // Schedule sooner for incorrect answers
        const nextReview = now + SRS_INTERVALS_MS[0];

        set((state) => ({
          wordStates: {
            ...state.wordStates,
            [wordId]: {
              ...currentState,
              familiarityScore: newScore,
              incorrectCount: currentState.incorrectCount + 1,
              lastSeenAt: now,
              nextReviewAt: nextReview,
            },
          },
        }));
      },

      swipeRight: (wordId) => {
        // User knows the word - increase familiarity
        get().recordCorrectAnswer(wordId);
      },

      swipeLeft: (wordId) => {
        // User needs to review - mark for sooner review
        const currentState = get().getWordState(wordId);
        const now = Date.now();
        const nextReview = now + SRS_INTERVALS_MS[0];

        set((state) => ({
          wordStates: {
            ...state.wordStates,
            [wordId]: {
              ...currentState,
              lastSeenAt: now,
              nextReviewAt: nextReview,
            },
          },
        }));
      },

      addToCollection: (wordId, collectionId) => {
        const currentState = get().getWordState(wordId);
        if (currentState.collections.includes(collectionId)) return;

        set((state) => ({
          wordStates: {
            ...state.wordStates,
            [wordId]: {
              ...currentState,
              collections: [...currentState.collections, collectionId],
            },
          },
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? { ...c, wordIds: [...c.wordIds, wordId] }
              : c,
          ),
        }));
      },

      removeFromCollection: (wordId, collectionId) => {
        const currentState = get().getWordState(wordId);

        set((state) => ({
          wordStates: {
            ...state.wordStates,
            [wordId]: {
              ...currentState,
              collections: currentState.collections.filter(
                (id) => id !== collectionId,
              ),
            },
          },
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? { ...c, wordIds: c.wordIds.filter((id) => id !== wordId) }
              : c,
          ),
        }));
      },

      createCollection: (name) => {
        const id = `col_${Date.now()}`;
        set((state) => ({
          collections: [
            ...state.collections,
            { id, name, wordIds: [], createdAt: Date.now() },
          ],
        }));
        return id;
      },

      deleteCollection: (collectionId) => {
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== collectionId),
        }));
      },

      getWordsToReview: () => {
        const now = Date.now();
        const { wordStates } = get();
        return Object.values(wordStates)
          .filter((ws) => ws.nextReviewAt !== null && ws.nextReviewAt <= now)
          .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0))
          .map((ws) => ws.wordId);
      },

      getFavoriteWordIds: () => {
        const { wordStates } = get();
        return Object.values(wordStates)
          .filter((ws) => ws.isFavorite)
          .map((ws) => ws.wordId);
      },

      getSavedWordIds: () => {
        const { wordStates } = get();
        return Object.values(wordStates)
          .filter((ws) => ws.isSaved)
          .map((ws) => ws.wordId);
      },

      addGameResult: (result) => {
        set((state) => ({
          gameResults: [...state.gameResults.slice(-49), result],
        }));
      },

      incrementPracticeCount: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            totalPractices: state.stats.totalPractices + 1,
          },
        }));
      },

      updateStreak: () => {
        const today = getTodayDateString();
        const { stats } = get();

        if (stats.lastActiveDate === today) {
          // Already active today
          return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        let newStreak = stats.currentStreak;
        if (stats.lastActiveDate === yesterdayStr) {
          // Continuing streak
          newStreak += 1;
        } else if (stats.lastActiveDate !== today) {
          // Streak broken
          newStreak = 1;
        }

        const newWeeklyActivity = getWeeklyActivity(
          stats.lastActiveDate,
          stats.weeklyActivity,
        );

        set({
          stats: {
            ...stats,
            currentStreak: newStreak,
            longestStreak: Math.max(stats.longestStreak, newStreak),
            lastActiveDate: today,
            weeklyActivity: newWeeklyActivity,
          },
        });
      },
    }),
    {
      name: "vocab-user-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
